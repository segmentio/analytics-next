import { fetch as defaultFetch } from '../../lib/fetch'
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
  headers?: Record<string, string>
  body?: string
  method: HTTPClientRequest['method']
}

/**
 * This interface is meant to be compatible with the Headers interface.
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Headers
 */
export interface HTTPHeaders {
  get: (key: string) => string | null
  has: (key: string) => boolean
  entries: () => IterableIterator<[string, any]>
}

/**
 * This interface is meant to very minimally conform to the Response interface.
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Response
 */
export interface HTTPResponse {
  headers?: Record<string, any> | HTTPHeaders
  text: () => Promise<string>
  json: () => Promise<any>
  ok: boolean
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
   * @example 'https://api.segment.io/v1/t'
   */
  url: string
  /**
   * HTTP method to be used for the request.
   **/
  method: string
  /**
   * Headers to be sent with the request
   */
  headers?: Record<string, string>
  /**
   * Data to be sent with the request
   */
  body?: string

  /**
   * Other options defined by the fetch API
   */
  [key: string]: unknown
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
  makeRequest(options: HTTPClientRequest): Promise<HTTPResponse> {
    return this._fetch(options.url, options)
  }
}
