import { JSONArray, JSONObject, JSONValue } from '@segment/analytics-next'
import {
  createRequestId,
  isOk,
  normalizeHeaders,
  normalizeRequestInfo,
  tryJSONParse,
} from './helpers'

let origFetch: typeof window.fetch
let origXMLHttpRequest: typeof XMLHttpRequest

export interface NetworkInterceptorRequest {
  url: string
  method: string
  contentType: string | undefined
  body: string | undefined
  headers: Headers | undefined
  id: string
}

export interface NetworkInterceptorResponse {
  url: string
  status: number
  ok: boolean
  statusText: string
  headers: Headers
  body: () => Promise<JSONValue>
  initiator: 'fetch' | 'xhr'
  responseType: XMLHttpRequestResponseType | undefined
  req: {
    id: string
  }
}

const createInterceptorRequest = ({
  url,
  body,
  headers,
  id,
  method,
}: {
  url: URL | string
  body: string | undefined
  method: string
  headers: Headers | undefined
  id: string
}): NetworkInterceptorRequest => ({
  url: url.toString(),
  method: method,
  headers,
  contentType: headers?.get('content-type') ?? undefined,
  body: typeof body == 'string' ? body : undefined,
  id,
})

const createInterceptorResponse = ({
  body,
  headers,
  initiator,
  status,
  statusText,
  url,
  responseType,
  id,
}: {
  body: () => Promise<JSONValue>
  headers: Headers
  initiator: 'fetch' | 'xhr'
  status: number
  statusText: string
  url: string
  responseType: XMLHttpRequestResponseType | undefined
  id: string
}): NetworkInterceptorResponse => ({
  body,
  headers,
  initiator,
  ok: isOk(status),
  status,
  statusText,
  url,
  responseType,
  req: {
    id: id,
  },
})

/**
 * Taken from https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/response
 */

export interface NetworkResponseHandler {
  (rs: NetworkInterceptorResponse): void
}

export interface NetworkRequestHandler {
  (rq: NetworkInterceptorRequest): void
}

/**
 * NetworkInterceptor class to intercept network requests and responses
 */
export class NetworkInterceptor {
  addInterceptors(
    onRequest: NetworkRequestHandler,
    onResponse: NetworkResponseHandler
  ) {
    this.addFetchInterceptor(onRequest, onResponse)
    this.addXhrInterceptor(onRequest, onResponse)
  }
  private addFetchInterceptor(
    onRequest: NetworkRequestHandler,
    onResponse: NetworkResponseHandler
  ) {
    if (!window.fetch) {
      return
    }
    origFetch = window.fetch
    window.fetch = async (...args) => {
      const [url, options] = args
      const id = createRequestId()
      try {
        const normalizedURL = normalizeRequestInfo(url)
        const headers = options?.headers
          ? normalizeHeaders(options.headers)
          : undefined

        onRequest(
          createInterceptorRequest({
            url: normalizedURL,
            body: typeof options?.body == 'string' ? options.body : undefined,
            method: options?.method ?? 'GET',
            headers,
            id,
          })
        )
      } catch (err) {
        console.log('Error handling request: ', err)
      }
      const ogResponse = await origFetch(...args)

      // response.text() etc is single use only -- to prevent conflicts with app code, use clone
      // https://developer.mozilla.org/en-US/docs/Web/API/Response/clone
      const response = ogResponse.clone()

      try {
        const lazyBody = async (): Promise<JSONValue> => {
          let text: string
          try {
            text = await response.text()
          } catch (err) {
            console.warn('Error converting to text', err, response)
            return null
          }
          return tryJSONParse(text) // should never throw.
        }

        onResponse(
          createInterceptorResponse({
            body: lazyBody,
            headers: response.headers,
            initiator: 'fetch',
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            responseType: undefined,
            id: id,
          })
        )
      } catch (err) {
        console.log('Error handling response: ', err)
      }
      return ogResponse
    }
  }

  private addXhrInterceptor(
    onRequest: NetworkRequestHandler,
    onResponse: NetworkResponseHandler
  ) {
    if (!window.XMLHttpRequest) {
      return
    }
    const OrigXMLHttpRequest = window.XMLHttpRequest
    class InterceptedXMLHttpRequest extends OrigXMLHttpRequest {
      _reqURL?: string
      _reqMethod?: string
      _reqBody?: XMLHttpRequestBodyInit
      _reqHeaders?: Headers
      _reqId = createRequestId()

      private getParsedXHRHeaders(allResponseHeaders: string): Headers {
        const headers = new Headers()
        allResponseHeaders
          .trim()
          .split(/[\r\n]+/)
          .forEach((line) => {
            const parts = line.split(': ')
            const header = parts.shift()
            const value = parts.join(': ')
            if (header) {
              headers.append(header, value)
            }
          })
        return headers
      }

      private getParsedXHRBody(): JSONValue {
        if (this.responseType === 'json') {
          return this.response as JSONObject | JSONArray | null
        } else if (typeof this.response === 'string') {
          return tryJSONParse(this.response)
        }
        return null
      }

      constructor() {
        super()

        this.addEventListener('readystatechange', () => {
          // Handle request
          if (this.readyState === this.HEADERS_RECEIVED) {
            try {
              onRequest(
                createInterceptorRequest({
                  url: this._reqURL!,
                  method: this._reqMethod!,
                  headers: this._reqHeaders,
                  id: this._reqId,
                  body: this._reqBody ? this._reqBody.toString() : undefined,
                })
              )
            } catch (err) {
              console.log('Error handling request', err)
            }
          }
          // Handle response
          if (this.readyState === this.DONE) {
            try {
              onResponse(
                createInterceptorResponse({
                  status: this.status,
                  responseType: this.responseType,
                  statusText: this.statusText,
                  url: this.responseURL,
                  initiator: 'xhr',
                  body: () => Promise.resolve(this.getParsedXHRBody()),
                  headers: this.getParsedXHRHeaders(
                    this.getAllResponseHeaders()
                  ),
                  id: this._reqId,
                })
              )
            } catch (err) {
              console.log('Error handling response', err)
            }
          }
        })
      }
      // @ts-ignore
      open(...args: Parameters<typeof XMLHttpRequest.prototype.open>): void {
        const [method, url] = args
        try {
          this._reqURL = url.toString()
          this._reqMethod = method
        } catch (err) {
          console.log('Error handling request (open)', err)
        }
        super.open(...args)
      }

      send(body?: XMLHttpRequestBodyInit): void {
        this._reqBody = body
        super.send(body)
      }

      setRequestHeader(
        ...args: Parameters<typeof XMLHttpRequest.prototype.setRequestHeader>
      ): void {
        try {
          const [header, value] = args
          if (!this._reqHeaders) {
            this._reqHeaders = new Headers()
          }
          this._reqHeaders.append(header, value)
        } catch (err) {
          console.log('Error handling request (setRequestHeader)', err)
        }
        super.setRequestHeader(...args)
      }
    }
    ;(window as any).XMLHttpRequest = InterceptedXMLHttpRequest
  }

  cleanup() {
    origXMLHttpRequest && (window.XMLHttpRequest = origXMLHttpRequest)
    origFetch && (window.fetch = origFetch)
  }
}
