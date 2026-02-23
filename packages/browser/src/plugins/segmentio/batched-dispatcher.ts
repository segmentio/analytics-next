import { SegmentEvent } from '../../core/events'
import { fetch } from '../../lib/fetch'
import { onPageChange } from '../../lib/on-page-change'
import { SegmentFacade } from '../../lib/to-facade'
import { RateLimitError } from './ratelimit-error'
import { Context } from '../../core/context'
import {
  BatchingDispatchConfig,
  computeBackoff,
  createHeaders,
  getStatusBehavior,
  parseRetryAfter,
  resolveHttpConfig,
  ResolvedHttpConfig,
} from './shared-dispatcher'

const MAX_PAYLOAD_SIZE = 500
const MAX_KEEPALIVE_SIZE = 64

function kilobytes(buffer: unknown): number {
  const size = encodeURI(JSON.stringify(buffer)).split(/%..|./).length - 1
  return size / 1024
}

/**
 * Checks if the payload is over or close to
 * the maximum payload size allowed by tracking
 * API.
 */
function approachingTrackingAPILimit(buffer: unknown): boolean {
  return kilobytes(buffer) >= MAX_PAYLOAD_SIZE - 50
}

/**
 * Checks if payload is over or approaching the limit for keepalive
 * requests. If keepalive is enabled we want to avoid
 * going over this to prevent data loss.
 */

function passedKeepaliveLimit(buffer: unknown): boolean {
  return kilobytes(buffer) >= MAX_KEEPALIVE_SIZE - 10
}

function chunks(batch: object[]): Array<object[]> {
  const result: object[][] = []
  let index = 0

  batch.forEach((item) => {
    const size = kilobytes(result[index])
    if (size >= 64) {
      index++
    }

    if (result[index]) {
      result[index].push(item)
    } else {
      result[index] = [item]
    }
  })

  return result
}

function buildBatch(buffer: object[]): {
  batch: object[]
  remaining: object[]
} {
  const batch: object[] = []

  for (let i = 0; i < buffer.length; i++) {
    const event = buffer[i]
    const candidate = [...batch, event]

    if (batch.length > 0 && approachingTrackingAPILimit(candidate)) {
      return { batch, remaining: buffer.slice(i) }
    }

    batch.push(event)
  }

  return { batch, remaining: [] }
}

export default function batch(
  apiHost: string,
  config?: BatchingDispatchConfig,
  httpConfig?: ResolvedHttpConfig
) {
  let buffer: object[] = []
  let pageUnloaded = false

  const limit = config?.size ?? 10
  const timeout = config?.timeout ?? 5000
  const resolved = httpConfig ?? resolveHttpConfig()
  let rateLimitTimeout = 0
  let requestCount = 0 // Tracks actual network requests for X-Retry-Count header
  let isRetrying = false
  let retryAfterRetries = 0
  let totalBackoffTime = 0
  let totalRateLimitTime = 0

  function sendBatch(batch: object[], retryCount: number) {
    if (batch.length === 0) {
      return
    }

    const writeKey = (batch[0] as SegmentEvent)?.writeKey

    // Remove sentAt from every event as batching only needs a single timestamp
    const updatedBatch = batch.map((event) => {
      const { sentAt, ...newEvent } = event as SegmentEvent
      return newEvent
    })

    const headers = createHeaders(config?.headers)
    headers['X-Retry-Count'] = String(retryCount)
    if (writeKey) {
      const authtoken = btoa(writeKey + ':')
      headers['Authorization'] = `Basic ${authtoken}`
    }

    return fetch(`https://${apiHost}/b`, {
      credentials: config?.credentials,
      keepalive: config?.keepalive || pageUnloaded,
      headers,
      method: 'post',
      body: JSON.stringify({
        writeKey,
        batch: updatedBatch,
        sentAt: new Date().toISOString(),
      }),
      // @ts-ignore - not in the ts lib yet
      priority: config?.priority,
    }).then((res) => {
      const status = res.status

      // Treat <400 as success (2xx/3xx)
      if (status < 400) {
        return
      }

      // Check for Retry-After header on eligible statuses (429, 408, 503).
      // These retries do NOT consume the maxRetries budget.
      const retryAfter = parseRetryAfter(res, resolved.rateLimitConfig)
      if (retryAfter) {
        throw new RateLimitError(
          `Rate limit exceeded: ${status}`,
          retryAfter.retryAfterMs,
          retryAfter.fromHeader
        )
      }

      // Use config-driven behavior for all other error statuses.
      const behavior = getStatusBehavior(status, resolved.backoffConfig)

      if (behavior === 'retry') {
        throw new Error(`Retryable error: ${status}`)
      }

      // Non-retryable: silently drop
    })
  }

  function dropAndContinue(): void {
    if (buffer.length > 0) {
      scheduleFlush(1)
    }
  }

  async function flush(attempt = 1): Promise<unknown> {
    if (!isRetrying) {
      requestCount = 0
      retryAfterRetries = 0
      totalBackoffTime = 0
      totalRateLimitTime = 0
    }
    isRetrying = false
    if (buffer.length) {
      const { batch, remaining } = buildBatch(buffer)
      if (batch.length === 0) {
        return
      }

      buffer = remaining
      const currentRetryCount = requestCount
      requestCount += 1
      return sendBatch(batch, currentRetryCount)
        ?.then((result) => {
          // If buildBatch left events due to payload size limits, schedule another flush
          if (buffer.length > 0) {
            scheduleFlush(1)
          }
          return result
        })
        .catch((error) => {
          const ctx = Context.system()
          ctx.log('error', 'Error sending batch', error)
          const maxRetries =
            config?.maxRetries ?? resolved.backoffConfig.maxRetryCount

          const isRateLimitError = error.name === 'RateLimitError'
          const isRetryableWithoutCount =
            isRateLimitError && error.isRetryableWithoutCount

          const canRetry = isRetryableWithoutCount || attempt <= maxRetries

          if (!canRetry) {
            return dropAndContinue()
          }

          // Rate-limit retries: enforce count cap and total duration cap
          if (isRetryableWithoutCount) {
            retryAfterRetries++
            if (retryAfterRetries > resolved.rateLimitConfig.maxRetryCount) {
              return dropAndContinue()
            }
            const delay = error.retryTimeout as number
            totalRateLimitTime += delay
            const maxRateLimitMs =
              resolved.rateLimitConfig.maxRateLimitDuration * 1000
            if (totalRateLimitTime > maxRateLimitMs) {
              return dropAndContinue()
            }
            rateLimitTimeout = delay
          }

          // Backoff retries: compute delay, enforce total duration cap
          let retryDelay: number | undefined
          if (!isRateLimitError) {
            retryDelay = computeBackoff(attempt, resolved.backoffConfig)
            totalBackoffTime += retryDelay
            const maxBackoffMs =
              resolved.backoffConfig.maxTotalBackoffDuration * 1000
            if (totalBackoffTime > maxBackoffMs) {
              return dropAndContinue()
            }
          }

          buffer = [...batch, ...buffer]
          batch.forEach((event) => {
            if ('_metadata' in event) {
              const segmentEvent = event as ReturnType<SegmentFacade['json']>
              segmentEvent._metadata = {
                ...segmentEvent._metadata,
                retryCount: attempt,
              }
            }
          })

          const nextAttempt = isRetryableWithoutCount ? attempt : attempt + 1
          isRetrying = true
          scheduleFlush(nextAttempt, retryDelay)
        })
    }
  }

  let schedule: NodeJS.Timeout | undefined

  function scheduleFlush(attempt = 1, retryDelay?: number): void {
    if (schedule) {
      return
    }

    const delay = rateLimitTimeout || retryDelay || timeout

    schedule = setTimeout(() => {
      schedule = undefined
      flush(attempt).catch(console.error)
    }, delay)
    rateLimitTimeout = 0
  }

  onPageChange((unloaded) => {
    pageUnloaded = unloaded

    if (pageUnloaded && buffer.length) {
      const reqs = chunks(buffer).map((b) => sendBatch(b, 0))
      Promise.all(reqs).catch(console.error)
    }
  })

  async function dispatch(
    _url: string,
    body: object,
    _retryCountHeader?: number
  ): Promise<unknown> {
    buffer.push(body)

    const bufferOverflow =
      buffer.length >= limit ||
      approachingTrackingAPILimit(buffer) ||
      (config?.keepalive && passedKeepaliveLimit(buffer))

    return bufferOverflow || pageUnloaded ? flush() : scheduleFlush()
  }

  return {
    dispatch,
  }
}
