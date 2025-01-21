import { fetch } from '../../lib/fetch'
import { RateLimitError } from './ratelimit-error'
import { createHeaders, StandardDispatcherConfig } from './shared-dispatcher'
export type Dispatcher = (url: string, body: object) => Promise<unknown>

export default function (config?: StandardDispatcherConfig): {
  dispatch: Dispatcher
} {
  function dispatch(url: string, body: object): Promise<unknown> {
    return fetch(url, {
      keepalive: config?.keepalive,
      headers: createHeaders(config?.headers),
      method: 'post',
      body: JSON.stringify(body),
      // @ts-ignore - not in the ts lib yet
      priority: config?.priority,
    }).then((res) => {
      if (res.status >= 500) {
        throw new Error(`Bad response from server: ${res.status}`)
      }
      if (res.status === 429) {
        const retryTimeoutStringSecs = res.headers?.get('x-ratelimit-reset')
        const retryTimeoutMS = retryTimeoutStringSecs
          ? parseInt(retryTimeoutStringSecs) * 1000
          : 5000
        throw new RateLimitError(
          `Rate limit exceeded: ${res.status}`,
          retryTimeoutMS
        )
      }
    })
  }

  return {
    dispatch,
  }
}
