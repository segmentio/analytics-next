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
    let traceString = 'false'
    if (config?.trace) {
      traceString = config?.trace ? 'true' : 'false'
    }
    return fetch(url, {
      keepalive: config?.keepalive,
      headers: {
        'Content-Type': 'text/plain',
        Trace: traceString,
      },
      method: 'post',
      body: JSON.stringify(body),
    })
  }

  return {
    dispatch,
  }
}
