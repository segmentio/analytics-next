let origFetch: typeof window.fetch

export class NetworkInterceptor {
  addFetchInterceptor(
    onRequest: (rs: Parameters<typeof window.fetch>) => void,
    onResponse: (rs: Response) => void
  ) {
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
  cleanup() {
    window.fetch = origFetch
  }
}
