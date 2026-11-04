import { getGlobalAnalytics } from './global-analytics-helper'
import { embeddedWriteKey } from './embedded-write-key'

const analyticsScriptRegex =
  /(https:\/\/.*)\/analytics\.js\/v1\/(?:.*?)\/(?:platform|analytics.*)?/

/**
 * The `src` of the script tag that actually loaded the SDK, snapshotted at boot.
 *
 * SECOPS-25767: previously the CDN was resolved by scanning EVERY <script> tag
 * in the document and keeping the last match. That let any pre-existing (even
 * inert) attacker-shaped <script src> redirect the SDK's config origin. We now
 * trust only `document.currentScript` - the tag that actually executed us.
 *
 * `document.currentScript` is only valid during the synchronous top-level run of
 * the loading script, so we snapshot it here and read the snapshot from the
 * async contexts that would otherwise see `null` (CSP fallback handler,
 * polyfill script.onload, deferred `.load()`).
 */
let _initialScriptSrc: string | undefined

const readCurrentScriptSrc = (): string | undefined => {
  if (typeof document === 'undefined') return undefined
  const current = document.currentScript as HTMLScriptElement | null
  const src = current?.getAttribute('src') || current?.src || ''
  return analyticsScriptRegex.test(src) ? src : undefined
}

/**
 * Snapshot the loading tag's src. Safe to call multiple times; only the first
 * successful (analytics-shaped) read is kept. Entrypoints call this at module
 * load, while `document.currentScript` still points at the SDK's own tag.
 */
export const captureInitialScriptSrc = (): void => {
  if (_initialScriptSrc) return
  const src = readCurrentScriptSrc()
  if (src) _initialScriptSrc = src
}

const getInitialScriptSrc = (): string | undefined => {
  // Prefer the boot snapshot; fall back to a live read in case getCDN() itself
  // is the first thing invoked while currentScript is still valid.
  if (!_initialScriptSrc) captureInitialScriptSrc()
  return _initialScriptSrc
}

/**
 * Origins Segment publishes analytics.js from. These are the only origins we
 * will trust from a tag we cannot prove loaded us.
 *
 * Deliberately origin-only, with no path component. The CDN base is taken from
 * the regex's greedy prefix capture, so allowing a path here would let anyone
 * who can publish under that path supply the settings we then fetch. That is
 * why a self-serve mirror such as cdn.jsdelivr.net must not be listed: an
 * attacker could publish an npm package and serve
 * cdn.jsdelivr.net/npm/<pkg>/analytics.js/v1/<key>/analytics.min.js. (Real
 * jsDelivr URLs for this SDK don't match analyticsScriptRegex anyway, so
 * listing it bought no legitimate coverage.)
 */
const PUBLIC_CDN_ALLOWLIST = [
  'https://cdn.segment.com',
  'https://cdn.segment.build',
]

/**
 * True only if `cdnBase` is exactly an allowlisted origin - no path, no
 * userinfo, no port games.
 */
const isAllowlistedCDN = (cdnBase: string): boolean =>
  PUBLIC_CDN_ALLOWLIST.indexOf(cdnBase.toLowerCase()) !== -1

/**
 * Fallback for when `document.currentScript` could not identify us (SDK loaded
 * via a bundler alongside a snippet, some tag-manager setups). We scan the DOM
 * like we used to, but only trust a tag whose derived CDN base is exactly one
 * of our own origins. This is a weaker guarantee than (1) - it proves only that
 * the origin is ours, not that the tag loaded us - so keep the allowlist to
 * origins whose content we control.
 */
const getAllowlistedCDNFromScriptTag = (): string | undefined => {
  if (typeof document === 'undefined') return undefined
  const scripts = Array.prototype.slice.call(
    document.querySelectorAll('script')
  )
  let src: string | undefined
  scripts.forEach((s) => {
    const candidate = s.getAttribute('src') ?? ''
    const result = analyticsScriptRegex.exec(candidate)
    if (result && result[1] && isAllowlistedCDN(result[1])) {
      src = candidate
    }
  })
  return src
}

/**
 * The script src we are willing to derive the CDN / write key from:
 * 1. the tag that actually loaded us (proven by document.currentScript), or
 * 2. a tag whose derived CDN base is exactly one of our own origins, if (1) is
 *    unavailable.
 */
export const getTrustedScriptSrc = (): string | undefined =>
  getInitialScriptSrc() ?? getAllowlistedCDNFromScriptTag()

const getCDNUrlFromScriptTag = (): string | undefined => {
  const src = getTrustedScriptSrc()
  if (!src) return undefined
  const result = analyticsScriptRegex.exec(src)
  return (result && result[1]) || undefined
}

let _globalCDN: string | undefined // set globalCDN as in-memory singleton
const getGlobalCDNUrl = (): string | undefined => {
  const result = _globalCDN ?? getGlobalAnalytics()?._cdn
  return result
}

export const setGlobalCDNUrl = (cdn: string) => {
  const globalAnalytics = getGlobalAnalytics()
  if (globalAnalytics) {
    globalAnalytics._cdn = cdn
  }
  _globalCDN = cdn
}

export const getCDN = (): string => {
  const globalCdnUrl = getGlobalCDNUrl()

  if (globalCdnUrl) return globalCdnUrl

  const cdnFromScriptTag = getCDNUrlFromScriptTag()

  if (cdnFromScriptTag) {
    return cdnFromScriptTag
  } else {
    // it's possible that the CDN is not found because:
    // - the SDK was loaded via a bundler / npm (no analytics.js script tag)
    // - the loading tag ran in a context where document.currentScript was null
    // - the script is loaded through a proxy and removed after execution
    // in this case, we fall back to the default Segment CDN
    return `https://cdn.segment.com`
  }
}

export const getNextIntegrationsURL = () => {
  const cdn = getCDN()
  return `${cdn}/next-integrations`
}

/**
 * Replaces the CDN URL in the script tag with the one from Analytics.js 1.0
 *
 * @returns the path to Analytics JS 1.0
 **/
export function getLegacyAJSPath(): string {
  const writeKey = embeddedWriteKey() ?? getGlobalAnalytics()?._writeKey

  const path = getTrustedScriptSrc()

  if (path) {
    return path.replace('analytics.min.js', 'analytics.classic.js')
  }

  return `https://cdn.segment.com/analytics.js/v1/${writeKey}/analytics.classic.js`
}
