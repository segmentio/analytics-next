import { SegmentEvent } from '../../core/events'
import { fetch } from '../../lib/fetch'
import { RateLimitError } from './ratelimit-error'
import {
  createHeaders,
  getStatusBehavior,
  parseRetryAfter,
  resolveHttpConfig,
  ResolvedHttpConfig,
  StandardDispatcherConfig,
} from './shared-dispatcher'

export type Dispatcher = (
  url: string,
  body: object,
  retryCountHeader?: number
) => Promise<unknown>

export default function (
  config?: StandardDispatcherConfig,
  httpConfig?: ResolvedHttpConfig
): {
  dispatch: Dispatcher
} {
  function dispatch(
    url: string,
    body: object,
    retryCountHeader?: number
  ): Promise<unknown> {
    const headers = createHeaders(config?.headers)
    const writeKey = (body as SegmentEvent)?.writeKey
    if (writeKey) {
      const authtoken = btoa(writeKey + ':')
      headers['Authorization'] = `Basic ${authtoken}`
    }
    headers['X-Retry-Count'] = String(retryCountHeader ?? 0)

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

      // Resolve config once (uses caller-supplied or built-in defaults).
      const resolved = httpConfig ?? resolveHttpConfig()

      // Determine retry/drop behavior from config (checks statusCodeOverrides first).
      const behavior = getStatusBehavior(status, resolved.backoffConfig)

      // Honor Retry-After for rate limiting, unless the status is explicitly
      // overridden to 'drop' via statusCodeOverrides.
      if (behavior !== 'drop') {
        const retryAfter = parseRetryAfter(res, resolved.rateLimitConfig)
        if (retryAfter) {
          throw new RateLimitError(
            `Rate limit exceeded: ${status}`,
            retryAfter.retryAfterMs,
            retryAfter.fromHeader
          )
        }
      }

      // Retry via backoff when the status is retryable.
      if (behavior === 'retry') {
        throw new Error(`Retryable error: ${status}`)
      }

      const err = new Error(`Non-retryable error: ${status}`) as Error & {
        name: string
      }
      err.name = 'NonRetryableError'
      throw err
    })
  }

  return {
    dispatch,
  }
}
