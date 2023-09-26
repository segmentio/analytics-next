import { isPlainObject } from '@segment/analytics-core'

export interface PageContext {
  path: string
  referrer: string
  search: string
  title: string
  url: string
}

type CanonicalUrl = string | undefined

export const BufferedPageContextDiscriminant = 'bpc' as const
/**
 * Page Context expected to be built by the snippet.
 * Note: The key names are super short because we want to keep the strings in the html snippet short to save bytes.
 */
export interface BufferedPageContext {
  __t: typeof BufferedPageContextDiscriminant // for extra uniqeness
  c: CanonicalUrl
  p: PageContext['path']
  u: PageContext['url']
  s: PageContext['search']
  t: PageContext['title']
  r: PageContext['referrer']
}

export const createBufferedPageContext = (
  url: string,
  canonicalUrl: CanonicalUrl,
  search: string,
  path: string,
  title: string,
  referrer: string
): BufferedPageContext => ({
  __t: BufferedPageContextDiscriminant,
  c: canonicalUrl,
  p: path,
  u: url,
  s: search,
  t: title,
  r: referrer,
})

// my clever/dubious way of making sure this type guard does not get out sync with the type definition
const BUFFERED_PAGE_CONTEXT_KEYS = Object.keys(
  createBufferedPageContext('', '', '', '', '', '')
) as (keyof BufferedPageContext)[]

export function isBufferedPageContext(
  bufferedPageCtx: unknown
): bufferedPageCtx is BufferedPageContext {
  if (!isPlainObject(bufferedPageCtx)) return false
  if (bufferedPageCtx.__t !== BufferedPageContextDiscriminant) return false

  for (const k of BUFFERED_PAGE_CONTEXT_KEYS) {
    if (!(k in bufferedPageCtx)) return false
  }
  // if object has both the correct key names AND the right number of keys, assume it's a BufferedPageContext
  if (
    Object.keys(bufferedPageCtx).length !== BUFFERED_PAGE_CONTEXT_KEYS.length
  ) {
    return false
  }
  return true
}

//  Legacy logic: we are we appending search parameters to the canonical URL -- I guess the canonical URL is  "not canonical enough" (lol)
const createCanonicalURL = (canonicalUrl: string, searchParams: string) => {
  return canonicalUrl.indexOf('?') > -1
    ? canonicalUrl
    : canonicalUrl + searchParams
}

/**
 * Strips hash from URL.
 * http://www.segment.local#test -> http://www.segment.local
 */
const removeHash = (href: string) => {
  const hashIdx = href.indexOf('#')
  return hashIdx === -1 ? href : href.slice(0, hashIdx)
}

const formatCanonicalPath = (canonicalUrl: string) => {
  const a = document.createElement('a')
  a.href = canonicalUrl
  // remove leading slash from canonical URL path
  return a.pathname[0] === '/' ? a.pathname : '/' + a.pathname
}

export const createPageContext = ({
  c: canonicalUrl,
  p: pathname,
  s: search,
  u: url,
  r: referrer,
  t: title,
}: BufferedPageContext): PageContext => {
  const newPath = canonicalUrl ? formatCanonicalPath(canonicalUrl) : pathname
  const newUrl = canonicalUrl
    ? createCanonicalURL(canonicalUrl, search)
    : removeHash(url)
  return {
    path: newPath,
    referrer,
    search,
    title,
    url: newUrl,
  }
}

export const getDefaultBufferedPageContext = (): BufferedPageContext => {
  const c = document.querySelector("link[rel='canonical']")
  return createBufferedPageContext(
    location.href,
    (c && c.getAttribute('href')) || undefined,
    location.search,
    location.pathname,
    document.title,
    document.referrer
  )
}

/**
 * Get page properties from the browser window/document.
 */
export function getDefaultPageContext(): PageContext {
  return createPageContext(getDefaultBufferedPageContext())
}
