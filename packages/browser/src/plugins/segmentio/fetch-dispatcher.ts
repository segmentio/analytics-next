import { fetch } from '../../lib/fetch'

export type Dispatcher = (url: string, body: object) => Promise<unknown>

export default function (): { dispatch: Dispatcher } {
  function dispatch(url: string, body: object): Promise<unknown> {
    return fetch(url, {
      keepalive: true,
      headers: { 'Content-Type': 'text/plain' },
      method: 'post',
      body: JSON.stringify(body),
    })
  }

  return {
    dispatch,
  }
}
