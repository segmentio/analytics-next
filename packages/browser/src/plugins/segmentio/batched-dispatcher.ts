import { SegmentEvent } from '../../core/events'
import { fetch } from '../../lib/fetch'
import { onPageChange } from '../../lib/on-page-change'
import { SegmentFacade } from '../../lib/to-facade'
import { RateLimitError } from './ratelimit-error'
import { Context } from '../../core/context'
import { BatchingDispatchConfig, createHeaders } from './shared-dispatcher'

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
  config?: BatchingDispatchConfig
) {
  let buffer: object[] = []
  let pageUnloaded = false

  const limit = config?.size ?? 10
  const timeout = config?.timeout ?? 5000
  let rateLimitTimeout = 0
  let totalAttempts = 0 // Track all attempts for X-Retry-Count header

  function sendBatch(batch: object[]) {
    if (batch.length === 0) {
      return
    }

    const writeKey = (batch[0] as SegmentEvent)?.writeKey

    // Remove sentAt from every event as batching only needs a single timestamp
    const updatedBatch = batch.map((event) => {
      const { sentAt, ...newEvent } = event as SegmentEvent
      return newEvent
    })

    // Increment total attempts for this batch series
    totalAttempts += 1

    const headers = createHeaders(config?.headers)
    headers['X-Retry-Count'] = String(totalAttempts - 1)
    const authtoken = btoa(writeKey + ':')
    headers['Authorization'] = `Basic ${authtoken}`

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
        totalAttempts = 0
        return
      }

      const retryAfterHeader = res.headers?.get('Retry-After')

      let retryAfterSeconds: number | undefined
      let fromRetryAfterHeader = false

      if (retryAfterHeader) {
        const parsed = parseInt(retryAfterHeader, 10)
        if (!Number.isNaN(parsed)) {
          retryAfterSeconds = parsed
          fromRetryAfterHeader = true
        }
      }

      const retryAfterMs =
        retryAfterSeconds !== undefined ? retryAfterSeconds * 1000 : undefined

      // 429, 408, 503 with Retry-After header: respect header delay.
      // These retries do NOT consume the maxRetries budget.
      if ([429, 408, 503].includes(status) && retryAfterMs !== undefined) {
        throw new RateLimitError(
          `Rate limit exceeded: ${status}`,
          retryAfterMs,
          fromRetryAfterHeader
        )
      }

      // 5xx other than 501, 505, 511 are retryable with backoff
      if (status >= 500) {
        if (status === 501 || status === 505 || status === 511) {
          // Non-retryable server errors
          totalAttempts = 0
          return
        }

        throw new Error(`Bad response from server: ${status}`)
      }

      // Retryable 4xx: 408, 410, 429, 460
      if (status >= 400 && status < 500) {
        if ([408, 410, 429, 460].includes(status)) {
          throw new Error(`Retryable client error: ${status}`)
        }

        // Non-retryable 4xx
        totalAttempts = 0
        return
      }

      // Any other status codes are treated as non-retryable
      totalAttempts = 0
    })
  }

  async function flush(attempt = 1): Promise<unknown> {
    if (buffer.length) {
      const { batch, remaining } = buildBatch(buffer)
      if (batch.length === 0) {
        return
      }

      buffer = remaining
      return sendBatch(batch)?.catch((error) => {
        const ctx = Context.system()
        ctx.log('error', 'Error sending batch', error)
        const maxRetries = config?.maxRetries ?? 10

        const isRateLimitError = error.name === 'RateLimitError'
        const isRetryableWithoutCount =
          isRateLimitError && error.isRetryableWithoutCount

        const canRetry = isRetryableWithoutCount || attempt <= maxRetries

        if (!canRetry) {
          totalAttempts = 0
          return
        }

        if (isRateLimitError) {
          rateLimitTimeout = error.retryTimeout
        }

        buffer = [...batch, ...buffer]
        buffer.map((event) => {
          if ('_metadata' in event) {
            const segmentEvent = event as ReturnType<SegmentFacade['json']>
            segmentEvent._metadata = {
              ...segmentEvent._metadata,
              retryCount: attempt,
            }
          }
        })

        const nextAttempt = isRetryableWithoutCount ? attempt : attempt + 1
        scheduleFlush(nextAttempt)
      })
    }
  }

  let schedule: NodeJS.Timeout | undefined

  function scheduleFlush(attempt = 1): void {
    if (schedule) {
      return
    }

    schedule = setTimeout(
      () => {
        schedule = undefined
        flush(attempt).catch(console.error)
      },
      rateLimitTimeout ? rateLimitTimeout : timeout
    )
    rateLimitTimeout = 0
  }

  onPageChange((unloaded) => {
    pageUnloaded = unloaded

    if (pageUnloaded && buffer.length) {
      const reqs = chunks(buffer).map((b) => sendBatch(b))
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
