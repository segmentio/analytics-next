import { fetch } from '../../lib/fetch'
import { RateLimitError } from './ratelimit-error'

export type Dispatcher = (url: string, body: object) => Promise<unknown>

export type StandardDispatcherConfig = {
  keepalive?: boolean
}

export default function (config?: StandardDispatcherConfig): {
  dispatch: Dispatcher
} {
  function dispatch(url: string, body: object): Promise<unknown> {
    console.log('dispatching', url, body)
    return fetch(url, {
      keepalive: config?.keepalive,
      headers: { 'Content-Type': 'text/plain' },
      method: 'post',
      body: JSON.stringify(body),
    }).then((res) => {
      if (res.status >= 500) {
        throw new Error(`Bad response from server: ${res.status}`)
      }
      if (res.status == 429) {
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
