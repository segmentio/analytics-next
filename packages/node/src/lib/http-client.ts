export interface AnalyticsHTTPClientOptions {
  headers?: Record<string, string>
  body?: string
  method?: string
  signal?: any // AbortSignal type does not play nicely with node-fetch
}

export interface AnalyticsHTTPClientResponse {
  readonly ok: boolean
  readonly status: number
  readonly statusText: string
  readonly type: ResponseType
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
    resource: string,
    options: AnalyticsHTTPClientOptions
  ): Promise<AnalyticsHTTPClientResponse> {
    if (globalThis.fetch) {
      return globalThis.fetch(resource, options)
    } // @ts-ignore
    // This guard causes is important, as it causes dead-code elimination to be enabled inside this block.
    else if (typeof EdgeRuntime !== 'string') {
      // @ts-ignore
      return (await import('node-fetch')).default(payload, options) as Response
    } else {
      throw new Error(
        'Invariant: an edge runtime that does not support fetch should not exist'
      )
    }
  }
}
