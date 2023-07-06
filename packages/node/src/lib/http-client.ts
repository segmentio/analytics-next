import type { Analytics } from '../app/analytics-node'
import { NodeEmitter } from '../app/emitter'
import { abortSignalAfterTimeout } from './abort'

export interface HTTPFetchClientResponse {
  ok: boolean
  status: number
  statusText: string
  /**
   * Using string, but this is also response type
   * "basic" | "cors" | "default" | "error" | "opaque" | "opaqueredirect";
   */
  // type: string
}

export interface HTTPFetchFn {
  (
    url: string | URL,
    options?: HTTPClientOptions
  ): Promise<HTTPFetchClientResponse>
}

export interface HTTPClient {
  makeRequest(
    _options: HTTPRequestOptions,
    emitter: NodeEmitter
  ): Promise<HTTPFetchClientResponse>
}

interface HTTPRequestOptions {
  url: string
  method: string
  headers: Record<string, string>
  data: Record<string, any>
  timeout: number
}

export interface HTTPClientOptions {
  headers?: Record<string, string>
  body?: string
  method?: string
  signal?: any // AbortSignal type does not play nicely with node-fetch
}

/**
 * A client that sends http requests.
 */
export interface AnalyticsHTTPClientDELETE {
  /**
   *  Compatible with the fetch API
   */
  send(
    url: string,
    options: HTTPClientOptions
  ): Promise<HTTPFetchClientResponse>
}

export class FetchHTTPClient implements HTTPClient {
  private _fetch: HTTPFetchFn
  constructor(fetchFn: HTTPFetchFn | typeof globalThis.fetch) {
    this._fetch = fetchFn
  }
  async makeRequest(
    options: HTTPRequestOptions,
    analytics: Analytics
  ): Promise<HTTPFetchClientResponse> {
    const [signal, timeoutId] = abortSignalAfterTimeout(options.timeout)

    const requestInit = {
      url: options.url,
      method: options.method,
      headers: options.headers,
      body: JSON.stringify(options.data),
      signal: signal,
    }

    analytics.emit('http_request', {
      url: requestInit.url,
      method: requestInit.method,
      headers: requestInit.headers,
      body: requestInit.body,
    })
    const response = await this._fetch(options.url, requestInit)
    clearTimeout(timeoutId)
    return response
  }
}
