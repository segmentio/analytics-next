import { SegmentEvent } from '../../core/events'
import { fetch } from '../../lib/fetch'
import { onPageChange } from '../../lib/on-page-change'
import { RateLimitError } from './ratelimit-error'

export type BatchingDispatchConfig = {
  size?: number
  timeout?: number
  retryAttempts?: number
  keepalive?: boolean
}

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

export default function batch(
  apiHost: string,
  config?: BatchingDispatchConfig
) {
  let buffer: object[] = []
  let pageUnloaded = false

  const limit = config?.size ?? 10
  const timeout = config?.timeout ?? 5000
  let ratelimittimeout = 0

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

    return fetch(`https://${apiHost}/b`, {
      keepalive: config?.keepalive || pageUnloaded,
      headers: {
        'Content-Type': 'text/plain',
      },
      method: 'post',
      body: JSON.stringify({
        writeKey,
        batch: updatedBatch,
        sentAt: new Date().toISOString(),
      }),
    }).then((res) => {
      if (res.status >= 500) {
        throw new Error(`Bad response from server: ${res.status}`)
      }
      if (res.status === 429) {
        const retryTimeoutStringSecs = res.headers?.get('x-ratelimit-reset')
        const retryTimeoutMS =
          retryTimeoutStringSecs != null
            ? parseInt(retryTimeoutStringSecs) * 1000
            : timeout
        throw new RateLimitError(
          `Rate limit exceeded: ${res.status}`,
          retryTimeoutMS
        )
      }
    })
  }

  async function flush(attempt = 1): Promise<unknown> {
    if (buffer.length) {
      const batch = buffer
      buffer = []
      return sendBatch(batch)?.catch((error) => {
        console.error('Error sending batch', error)
        if (attempt < (config?.retryAttempts ?? 10)) {
          if (error.name === 'RateLimitError') {
            ratelimittimeout = error.retryTimeout
          }
          buffer.push(batch)
          scheduleFlush(attempt + 1)
        }
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
      ratelimittimeout ? ratelimittimeout : timeout
    )
    ratelimittimeout = 0
  }

  onPageChange((unloaded) => {
    pageUnloaded = unloaded

    if (pageUnloaded && buffer.length) {
      const reqs = chunks(buffer).map(sendBatch)
      Promise.all(reqs).catch(console.error)
    }
  })

  async function dispatch(_url: string, body: object): Promise<unknown> {
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
