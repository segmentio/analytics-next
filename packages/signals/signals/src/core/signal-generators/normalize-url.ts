/**
 * Normalize URL provided by the fetch API into a valid URL string that can be used with new URL.
 */
export const normalizeUrl = (urlOrPath: string): string => {
  if (urlOrPath.startsWith('http')) {
    return urlOrPath
  }
  if (urlOrPath.startsWith('/')) {
    return window.location.origin + urlOrPath
  }
  if (urlOrPath.includes('.')) {
    return `${location.protocol}//${urlOrPath}`
  }
  return window.location.origin + '/' + urlOrPath
}
