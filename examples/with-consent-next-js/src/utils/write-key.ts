export const getWriteKeyFromQueryString = (): string | undefined => {
  const writeKey = new URLSearchParams(window.location.search).get('writekey')
  return writeKey || undefined
}
