import { fetch } from '../../lib/fetch'

export type Dispatcher = (url: string, body: object) => Promise<unknown>

export interface FetchConfig {
  keepalive?: boolean
}
export default function (config: FetchConfig = {}): {
  dispatch: Dispatcher
} {
  function dispatch(url: string, body: object): Promise<unknown> {
    return fetch(url, {
      keepalive: config.keepalive,
      headers: { 'Content-Type': 'text/plain' },
      method: 'post',
      body: JSON.stringify(body),
    })
  }

  return {
    dispatch,
  }
}
