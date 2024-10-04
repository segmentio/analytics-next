import { JSONArray, JSONObject } from '@segment/analytics-next'

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

export const normalizeHeaders = (headers: HeadersInit): Headers => {
  return headers instanceof Headers ? headers : new Headers(headers)
}

/**
 * @example expect(containsContentType(headers, ['application/json'])).toBe(true)
 */
export const containsContentType = (
  headers: HeadersInit | undefined,
  match: string[]
): boolean => {
  if (!headers) {
    return false
  }
  const normalizedHeaders = normalizeHeaders(headers)

  // format the content-type header to remove charset -- this is non-standard behavior that is somewhat common
  // e.g. application/json;charset=utf-8 => application/json
  const removeCharset = (header: string | null): string | null =>
    header?.split(';')[0] ?? null

  return match.some(
    (t) => removeCharset(normalizedHeaders.get('content-type')) === t
  )
}

export const containsJSONContentType = (
  headers: HeadersInit | undefined
): boolean => {
  return containsContentType(headers, ['application/json'])
}

export function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return (
    Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === 'object'
  )
}

export const isOk = (status: number) => status >= 200 && status < 300

/**
 * Safely parse JSON, if it fails, return the original text.
 */
export const tryJSONParse = (text: string): JSONObject | JSONArray | string => {
  try {
    return JSON.parse(text)
  } catch (err) {
    return text
  }
}
