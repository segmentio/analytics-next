import { SignalEmitter } from '../emitter'
import { SignalGenerator } from './types'
let origFetch: typeof window.fetch

export function addFetchInterceptor(
  onRequest: (rs: any) => void,
  onResponse: (rs: Response) => void
) {
  console.debug('Adding fetch interceptor')
  origFetch = window.fetch
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

const normalizeHeaders = (headers: HeadersInit): Headers => {
  return headers instanceof Headers ? headers : new Headers(headers)
}

const containsJSONContent = (headers: HeadersInit | undefined): boolean => {
  if (!headers) {
    return false
  }
  const normalizedHeaders = normalizeHeaders(headers)
  return (
    normalizedHeaders.get('content-type')?.includes('application/json') ||
    normalizedHeaders.get('Content-Type')?.includes('application/json') ||
    false
  )
}

export class NetworkGenerator implements SignalGenerator {
  id = 'network'
  register(emitter: SignalEmitter) {
    const handleRequest = ([url, rq]: Parameters<typeof window.fetch>) => {
      if (!rq || !rq.body) {
        return
      }
      const rIsAbs = new RegExp('^(?:[a-z+]+:)?//', 'i')
      if (
        !url ||
        (rIsAbs.test(url.toString()) &&
          !url.toString().includes(window.location.hostname))
      ) {
        return
      }

      if (!containsJSONContent(rq.headers)) {
        return
      }

      emitter.emit({
        type: 'network',
        data: {
          action: 'Request',
          url: url,
          method: rq.method,
          data: JSON.parse(rq.body.toString()),
        },
      })
    }
    const handleResponse = async (rs: Response) => {
      if (!containsJSONContent(rs.headers)) {
        return
      }
      const url = rs.url
      if (!url || !new URL(url).hostname.includes(window.location.hostname)) {
        return
      }

      const data = await rs.json()
      emitter.emit({
        type: 'network',
        data: {
          action: 'Response',
          url: url,
          data: data,
        },
      })
    }
    addFetchInterceptor(handleRequest, handleResponse)
    return () => {
      console.debug('Removing fetch interceptor')
      window.fetch = origFetch
    }
  }
}
