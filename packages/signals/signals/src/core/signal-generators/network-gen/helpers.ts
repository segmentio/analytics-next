/**
 * @example example.foo.bar.com => example.com
 * @example example.foo.co.uk => example.co.uk
 */
export const getDomainFromHost = (hostName: string): string => {
  const modified = hostName.replace('www.', '')
  const parts = modified.split('.')
  let offset = 2
  if (
    // handle .co.uk, .com.au, .org.uk, .eu.com etc
    // this is a naive approach, but it's good enough for our use case
    ['co', 'com', 'org', 'eu'].includes(parts[parts.length - 2])
  ) {
    offset = 3
  }
  return parts.slice(-offset).join('.')
}

export const isSameDomain = (url: string): boolean => {
  // Relative URL like /foo/bar will always be considered same domain
  const rIsAbs = new RegExp('^(?:[a-z+]+:)?//', 'i')
  if (!rIsAbs.test(url)) {
    return true
  }
  const host = new URL(url).hostname
  return getDomainFromHost(host) === getDomainFromHost(window.location.hostname)
}

const normalizeHeaders = (headers: HeadersInit): Headers => {
  return headers instanceof Headers ? headers : new Headers(headers)
}

export const containsJSONContent = (
  headers: HeadersInit | undefined
): boolean => {
  if (!headers) {
    return false
  }
  const normalizedHeaders = normalizeHeaders(headers)
  return normalizedHeaders.get('content-type') === 'application/json'
}
