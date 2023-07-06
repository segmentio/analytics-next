import { abortSignalAfterTimeout } from './abort'

export interface HTTPFetchClientResponse {
  ok: boolean
  status: number
  statusText: string
}

/**
 * This interface is meant to be compatible with different fetch implementations.
 */
export interface HTTPFetchFn {
  (
    url: string,
    options: FetchHTTPClientOptions
  ): Promise<HTTPFetchClientResponse>
}

export interface HTTPRequestOptions {
  url: string
  method: string
  headers: Record<string, string>
  data: Record<string, any>
  timeout: number
}

export interface FetchHTTPClientOptions {
  headers?: Record<string, string>
  body?: string
  method?: string
  signal?: any // AbortSignal type does not play nicely with node-fetch
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
