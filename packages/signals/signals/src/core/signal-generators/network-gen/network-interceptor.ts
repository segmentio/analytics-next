import { JSONArray, JSONObject, JSONValue } from '@segment/analytics-next'
import { isOk, normalizeHeaders, tryJSONParse } from './helpers'

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
  addFetchInterceptor(
    onRequest: NetworkRequestHandler,
    onResponse: NetworkResponseHandler
  ) {
    if (!window.fetch) {
      return
    }
    origFetch = window.fetch
    window.fetch = async (...args) => {
      const [url, options] = args
      const headers = options?.headers
        ? normalizeHeaders(options.headers)
        : undefined

      const id = Math.random().toString(36).substring(3)
      const createRequest = (): NetworkInterceptorRequest => ({
        url: url.toString(),
        method: options?.method ?? 'GET',
        headers,
        contentType: headers?.get('content-type') ?? undefined,
        body: typeof options?.body == 'string' ? options.body : undefined,
        id,
      })

      try {
        onRequest(createRequest())
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

        onResponse({
          body: lazyBody,
          headers: response.headers,
          initiator: 'fetch',
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          responseType: undefined,
          req: {
            id,
          },
        })
      } catch (err) {
        console.log('Error handling response: ', err)
      }
      return response
    }
  }

  addXhrInterceptor(
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
      _reqId = Math.random().toString(36).substring(3)

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
          const createRequest = (): NetworkInterceptorRequest => ({
            url: this._reqURL!,
            method: this._reqMethod!,
            contentType: this._reqHeaders?.get('content-type') ?? undefined,
            body: this._reqBody ? this._reqBody.toString() : undefined,
            headers: this._reqHeaders,
            id: this._reqId,
          })
          // Handle request
          if (this.readyState === this.HEADERS_RECEIVED) {
            try {
              onRequest(createRequest())
            } catch (err) {
              console.log('Error handling request', err)
            }
          }
          // Handle response
          if (this.readyState === this.DONE) {
            try {
              onResponse({
                status: this.status,
                ok: isOk(this.status),
                responseType: this.responseType,
                statusText: this.statusText,
                url: this.responseURL,
                initiator: 'xhr',
                body: () => Promise.resolve(this.getParsedXHRBody()),
                headers: this.getParsedXHRHeaders(this.getAllResponseHeaders()),
                req: {
                  id: this._reqId,
                },
              })
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
