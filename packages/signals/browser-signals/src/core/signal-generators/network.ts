import { SignalEmitter } from '../emitter'
import { SignalGenerator } from './types'
const { fetch: origFetch } = window

export function addFetchInterceptor(
  onRequest: (rs: any) => void,
  onResponse: (rs: Response) => void
) {
  console.log('Adding fetch interceptor')
  window.fetch = async (...args) => {
    try {
      onRequest(args)
    } catch (err) {
      console.log('Error handling request: ', err)
    }
    const response = await origFetch(...args)
    try {
      onResponse(response.clone())
    } catch (err) {
      console.log('Error handling response: ', err)
    }
    return response
  }
}

export class NetworkGenerator implements SignalGenerator {
  id = 'network'
  register(emitter: SignalEmitter) {
    const handleRequest = (rq: any) => {
      const rIsAbs = new RegExp('^(?:[a-z+]+:)?//', 'i')
      const url = rq[0]
      if (
        !url ||
        (rIsAbs.test(url) && !url.includes(window.location.hostname))
      ) {
        return
      }
      if (!rq[1].headers['Content-Type'].includes('application/json')) {
        return
      }

      emitter.emit({
        type: 'network',
        data: {
          action: 'Request',
          url: url,
          method: rq[1].method,
          headers: rq[1].headers,
          body: JSON.parse(rq[1].body),
        },
      })
    }
    const handleResponse = async (rs: Response) => {
      const headers = rs.headers
      if (!headers.get('content-type')?.includes('application/json')) {
        return
      }
      const url = rs.url
      if (!url || !new URL(url).hostname.includes(window.location.hostname)) {
        return
      }

      const data = await rs.json().then((val) => val)
      emitter.emit({
        type: 'network',
        data: {
          action: 'Response',
          url: url,
          headers: Object.fromEntries(headers.entries()),
          data: data,
        },
      })
    }
    addFetchInterceptor(handleRequest, handleResponse)
    return () => {
      console.log('Removing fetch interceptor')
      window.fetch = origFetch
    }
  }
}
