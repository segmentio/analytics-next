export interface AnalyticsHTTPClientOptions {
  headers: Record<string, string>
  body: string
  method: string
  signal: any // AbortSignal type does not play nicely with node-fetch
}

export interface AnalyticsHTTPClientResponse {
  ok: boolean
  status: number
  statusText: string
  type: ResponseType
}

/**
 * A client that sends http requests.
 */
export interface AnalyticsHTTPClient {
  /**
   *  Compatible with the fetch API
   */
  send(
    url: string,
    options: AnalyticsHTTPClientOptions
  ): Promise<AnalyticsHTTPClientResponse>
}

export class DefaultHTTPClient implements AnalyticsHTTPClient {
  async send(
    url: string,
    options: AnalyticsHTTPClientOptions
  ): Promise<AnalyticsHTTPClientResponse> {
    if (globalThis.fetch) {
      return globalThis.fetch(url, options)
    } // @ts-ignore
    // This guard causes is important, as it causes dead-code elimination to be enabled inside this block.
    else if (typeof EdgeRuntime !== 'string') {
      return (await import('node-fetch')).default(url, options)
    } else {
      throw new Error(
        'Invariant: an edge runtime that does not support fetch should not exist'
      )
    }
  }
}
