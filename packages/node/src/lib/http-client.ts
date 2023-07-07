import { abortSignalAfterTimeout } from './abort'

export interface HTTPFetchClientResponse {
  ok: boolean
  status: number
  statusText: string
}

/**
 * This interface is meant to be compatible with different fetch implementations.
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
export interface HTTPFetchFn {
  (
    url: string,
    requestInit: HTTPFetchRequestInit
  ): Promise<HTTPFetchClientResponse>
}

/**
 * This interface is meant to conform to the standard Fetch API RequestInit interface.
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Request
 */
export interface HTTPFetchRequestInit {
  headers?: Record<string, string>
  body?: string
  method?: string
  signal?: any // AbortSignal type does not play nicely with node-fetch
}

/**
 * This interface is meant to be a generic interface for making HTTP requests.
 * While it may overlap with fetch's Request interface, it is not coupled to it.
 */
export interface HTTPRequestOptions {
  url: string
  method: string
  headers: Record<string, string>
  data: Record<string, any>
  timeout: number
}

export interface HTTPClient {
  makeRequest(_options: HTTPRequestOptions): Promise<HTTPFetchClientResponse>
}

export class FetchHTTPClient implements HTTPClient {
  private _fetch: HTTPFetchFn
  constructor(fetchFn: HTTPFetchFn | typeof globalThis.fetch) {
    this._fetch = fetchFn
  }
  async makeRequest(
    options: HTTPRequestOptions
  ): Promise<HTTPFetchClientResponse> {
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
