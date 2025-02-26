import { PageData } from '@segment/analytics-signals-runtime'

export const getPageData = (): PageData => {
  return {
    path: location.pathname,
    referrer: document.referrer,
    title: document.title,
    search: location.search,
    url: location.href,
    hostname: location.hostname,
    hash: location.hash,
  }
}
