export const getOneTrustApiKeyFromQueryString = (): string | undefined => {
  const writeKey = new URLSearchParams(window.location.search).get(
    'onetrust_api_key'
  )
  return writeKey || undefined
}
