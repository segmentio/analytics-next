import {
  getGlobalCDNUrl,
  ANALYTICS_SCRIPT_REGEX,
} from '@segment/analytics-browser-globals'

const getCDNUrlFromScriptTag = (): string | undefined => {
  let cdn: string | undefined
  const scripts = Array.prototype.slice.call(
    document.querySelectorAll('script')
  )
  scripts.forEach((s) => {
    const src = s.getAttribute('src') ?? ''
    const result = ANALYTICS_SCRIPT_REGEX.exec(src)

    if (result && result[1]) {
      cdn = result[1]
    }
  })
  return cdn
}

export const getCDN = (): string => {
  const globalCdnUrl = getGlobalCDNUrl()

  if (globalCdnUrl) return globalCdnUrl

  const cdnFromScriptTag = getCDNUrlFromScriptTag()

  if (cdnFromScriptTag) {
    return cdnFromScriptTag
  } else {
    // it's possible that the CDN is not found in the page because:
    // - the script is loaded through a proxy
    // - the script is removed after execution
    // in this case, we fall back to the default Segment CDN
    return `https://cdn.segment.com`
  }
}
