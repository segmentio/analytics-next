import { abortSignalAfterTimeout } from './abort'
import { fetch as defaultFetch } from './fetch'

/**
 * This interface is meant to be compatible with different fetch implementations (node and browser).
 * Using the ambient fetch type is not possible because the AbortSignal type is not compatible with node-fetch.
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
export interface HTTPFetchFn {
  (url: string, requestInit: HTTPFetchRequest): Promise<HTTPResponse>
}

/**
 * This interface is meant to be compatible with the Request interface.
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Request
 */
export interface HTTPFetchRequest {
  headers: Record<string, string>
  body: string
  method: HTTPClientRequest['method']
  signal: any // AbortSignal type does not play nicely with node-fetch
}

/**
 * This interface is meant to very minimally conform to the Response interface.
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Response
 */
export interface HTTPResponse {
  status: number
  statusText: string
}

/**
 * This interface is meant to be a generic interface for making HTTP requests.
 * While it may overlap with fetch's Request interface, it is not coupled to it.
 */
export interface HTTPClientRequest {
  /**
   * URL to be used for the request
   * @example 'https://api.segment.io/v1/batch'
   */
  url: string
  /**
   * HTTP method to be used for the request. This will always be a 'POST' request.
   **/
  method: 'POST'
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
   * Specifies the timeout (in milliseconds) for an HTTP client to get an HTTP response from the server
   * @example 10000
   */
  httpRequestTimeout: number
}

/**
 * HTTP client interface for making requests
 */
export interface HTTPClient {
  makeRequest(_options: HTTPClientRequest): Promise<HTTPResponse>
}

/**
 * Default HTTP client implementation using fetch
 */
export class FetchHTTPClient implements HTTPClient {
  private _fetch: HTTPFetchFn
  constructor(fetchFn?: HTTPFetchFn) {
    this._fetch = fetchFn ?? defaultFetch
  }
  async makeRequest(options: HTTPClientRequest): Promise<HTTPResponse> {
    const [signal, timeoutId] = abortSignalAfterTimeout(
      options.httpRequestTimeout
    )

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
