import { SegmentEvent } from '../../core/events'
import { fetch } from '../../lib/fetch'
import { RateLimitError } from './ratelimit-error'
import { createHeaders, StandardDispatcherConfig } from './shared-dispatcher'
export type Dispatcher = (
  url: string,
  body: object,
  retryCountHeader?: number
) => Promise<unknown>

export default function (config?: StandardDispatcherConfig): {
  dispatch: Dispatcher
} {
  function dispatch(
    url: string,
    body: object,
    retryCountHeader?: number
  ): Promise<unknown> {
    const headers = createHeaders(config?.headers)
    const authtoken = (body as SegmentEvent)?.writeKey
    headers['Authorization'] = `Basic ${authtoken}`

    if (retryCountHeader !== undefined) {
      headers['X-Retry-Count'] = String(retryCountHeader)
    }

    return fetch(url, {
      credentials: config?.credentials,
      keepalive: config?.keepalive,
      headers,
      method: 'post',
      body: JSON.stringify(body),
      // @ts-ignore - not in the ts lib yet
      priority: config?.priority,
    }).then((res) => {
      const status = res.status

      // Treat <400 as success (2xx/3xx)
      if (status < 400) {
        return
      }

      // 429, 408, 503 with Retry-After header: respect header delay and
      // signal a rate-limit retry (these are treated specially by callers).
      if ([429, 408, 503].includes(status)) {
        const retryAfterHeader = res.headers?.get('Retry-After')
        if (retryAfterHeader) {
          const parsed = parseInt(retryAfterHeader, 10)
          if (!Number.isNaN(parsed)) {
            const retryAfterMs = parsed * 1000
            throw new RateLimitError(
              `Rate limit exceeded: ${status}`,
              retryAfterMs,
              true
            )
          }
        }
      }

      // 5xx: retry everything except 501, 505, and 511
      if (status >= 500) {
        if (status === 501 || status === 505 || status === 511) {
          const err = new Error(
            `Non-retryable server error: ${status}`
          ) as Error & { name: string }
          err.name = 'NonRetryableError'
          throw err
        }

        throw new Error(`Bad response from server: ${status}`)
      }

      // 4xx: only retry 408, 410, 413, 429, 460
      if (status >= 400 && status < 500) {
        if ([408, 410, 413, 429, 460].includes(status)) {
          throw new Error(`Retryable client error: ${status}`)
        }

        const err = new Error(
          `Non-retryable client error: ${status}`
        ) as Error & { name: string }
        err.name = 'NonRetryableError'
        throw err
      }
    })
  }

  return {
    dispatch,
  }
}
