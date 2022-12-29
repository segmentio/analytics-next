import unfetch from 'unfetch'

export type Dispatcher = (url: string, body: object) => Promise<unknown>

export default function (): { dispatch: Dispatcher } {
  function dispatch(url: string, body: object): Promise<unknown> {
    let fetch = unfetch
    if (typeof window !== 'undefined') {
      fetch = window.fetch || unfetch
    }
    return fetch(url, {
      headers: { 'Content-Type': 'text/plain' },
      method: 'post',
      body: JSON.stringify(body),
    })
  }

  return {
    dispatch,
  }
}
