export const getWriteKeyFromQueryString = (): string => {
  const writeKey = new URLSearchParams(window.location.search).get('writeKey')
  if (!writeKey) {
    throw new Error(
      'writeKey is a required query string param! (e.g. http://localhost:3000?writeKey=abc)'
    )
  }
  return writeKey
}
