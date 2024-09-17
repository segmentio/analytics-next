let origFetch: typeof window.fetch
let origXMLHttpRequest: typeof XMLHttpRequest

export interface OnFetchRequest {
  (rq: [url: RequestInfo | URL, init?: RequestInit | undefined]): void
}

export interface OnFetchResponse {
  (rs: Response): void
}

export interface XMLHttpRequestInit {
  method: string
  headers: Headers
  body: XMLHttpRequestBodyInit
  responseType: XMLHttpRequestResponseType
}
export interface onXHRRequest {
  (rq: [url: RequestInfo | URL, init?: XMLHttpRequestInit]): void
}

/**
 * Taken from https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/response
 */
export type XMLHTTPRequestResponseBody =
  | string
  | Document
  | ArrayBuffer
  | Blob
  | Record<string, unknown>
  | null

export interface onXHRResponse {
  (rs: {
    url: string
    status: number
    statusText: string
    headers: Headers
    body: XMLHTTPRequestResponseBody
    responseType: XMLHttpRequestResponseType
  }): void
}

/**
 * NetworkInterceptor class to intercept network requests and responses
 */
export class NetworkInterceptor {
  addFetchInterceptor(onRequest: OnFetchRequest, onResponse: OnFetchResponse) {
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

  addXhrInterceptor(onRequest: onXHRRequest, onResponse: onXHRResponse) {
    const OrigXMLHttpRequest = window.XMLHttpRequest
    class InterceptedXMLHttpRequest extends OrigXMLHttpRequest {
      _reqURL?: string
      _reqMethod?: string
      _reqBody?: XMLHttpRequestBodyInit
      _reqHeaders?: Headers
      constructor() {
        super()

        this.addEventListener('readystatechange', () => {
          // Handle request
          if (this.readyState === this.HEADERS_RECEIVED) {
            try {
              onRequest([
                this._reqURL!,
                {
                  body: this._reqBody!,
                  headers: this._reqHeaders!,
                  method: this._reqMethod!,
                  responseType: this.responseType,
                },
              ])
            } catch (err) {
              console.log('Error handling request', err)
            }
          }
          // Handle response
          if (this.readyState === this.DONE) {
            try {
              const headers = new Headers()
              const allResponseHeaders = this.getAllResponseHeaders()
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

              onResponse({
                status: this.status,
                responseType: this.responseType,
                statusText: this.statusText,
                url: this.responseURL,
                headers,
                body: this.response,
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
    window.XMLHttpRequest = origXMLHttpRequest
    window.fetch = origFetch
  }
}
