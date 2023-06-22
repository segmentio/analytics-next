interface CustomHTTPClient {
  send: (resource: any, options: any) => Promise<Response>
}

class DefaultFetchClient implements CustomHTTPClient {
  send = async (resource: any, options: any): Promise<Response> => {
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
