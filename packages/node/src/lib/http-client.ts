import { abortSignalAfterTimeout } from './abort'

/**
 * This interface is meant to be compatible with different fetch implementations.
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
export interface HTTPFetchFn {
  (url: string, requestInit: HTTPFetchRequest): Promise<HTTPFetchResponse>
}

/**
 * This interface is meant to he compatible with the Request interface.
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Request
 */
export interface HTTPFetchRequest {
  headers?: Record<string, string>
  body?: string
  method?: string
  signal?: any // AbortSignal type does not play nicely with node-fetch
}

/**
 * This interface is meant to conform to the Fetch API Response interface.
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Response
 */
export interface HTTPFetchResponse {
  ok: boolean
  status: number
  statusText: string
}

/**
 * This interface is meant to be a generic interface for making HTTP requests.
 * While it may overlap with fetch's Request interface, it is not coupled to it.
 */
export interface HTTPRequestOptions {
  /**
   * URL to be used for the request
   * @example 'https://api.segment.io/v1/batch'
   */
  url: string
  /**
   * HTTP method to be used for the request
   * @example 'POST'
   **/
  method: string
  /**
   * Headers to be sent with the request
   */
  headers: Record<string, string>
  /**
   * JSON data to be sent with the request (will be stringified)
   * @example { "batch": [ ... ]}
   */
  data: Record<string, any>
  /**
   * Timeout in milliseconds
   * @example 10000
   */
  timeout: number
}

export interface HTTPClient {
  makeRequest(_options: HTTPRequestOptions): Promise<HTTPFetchResponse>
}

export class FetchHTTPClient implements HTTPClient {
  private _fetch: HTTPFetchFn
  constructor(fetchFn: HTTPFetchFn) {
    this._fetch = fetchFn
  }
  async makeRequest(options: HTTPRequestOptions): Promise<HTTPFetchResponse> {
    const [signal, timeoutId] = abortSignalAfterTimeout(options.timeout)

    const requestInit = {
      url: options.url,
      method: options.method,
      headers: options.headers,
      body: JSON.stringify(options.data),
      signal: signal,
    }

    return this._fetch(options.url, requestInit).finally(() =>
      clearTimeout(timeoutId)
    )
  }
}
