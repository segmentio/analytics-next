import unfetch from 'unfetch'
import { objectHasProperty } from '../../lib/type-guards'

let fetch = unfetch
if (typeof window !== 'undefined') {
  fetch = window.fetch || unfetch
}

export type Dispatcher = (url: string, body: object) => Promise<unknown>

export default function (): { dispatch: Dispatcher } {
  function dispatch(url: string, body: object): Promise<unknown> {
    const headers: Record<string, string> = {}

    if (objectHasProperty(body, 'anonymousId')) {
      headers['anon-id'] = body.anonymousId as string
    }
    if (objectHasProperty(body, 'userId')) {
      headers['user-id'] = body.userId as string
    }

    return fetch(url, {
      headers: { 'Content-Type': 'text/plain', ...headers },
      method: 'post',
      body: JSON.stringify(body),
    })
  }

  return {
    dispatch,
  }
}
