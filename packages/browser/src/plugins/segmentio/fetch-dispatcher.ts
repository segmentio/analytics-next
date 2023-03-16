import { fetch } from '../../lib/fetch'

export type Dispatcher = (url: string, body: object) => Promise<unknown>

export type StandardDispatcherConfig = {
  keepalive?: boolean
  trace?: boolean
}

export default function (config?: StandardDispatcherConfig): {
  dispatch: Dispatcher
} {
  function dispatch(url: string, body: object): Promise<unknown> {
    const headers: {
      'Content-Type': string
      Trace?: string | undefined
    } = {
      'Content-Type': 'text/plain',
    }
    if (config?.trace === true) {
      headers.Trace = 'true'
    }
    return fetch(url, {
      keepalive: config?.keepalive,
      headers: headers,
      method: 'post',
      body: JSON.stringify(body),
    })
  }

  return {
    dispatch,
  }
}
