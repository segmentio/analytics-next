import { getGlobalAnalytics } from './global-analytics-helper'

export const getGlobalCDNUrl = (): string | undefined => {
  const result =
    (window as any)._globalAnalyticsCDN ?? getGlobalAnalytics()?._cdn
  return result
}

export const setGlobalCDNUrl = (cdn: string) => {
  const globalAnalytics = getGlobalAnalytics()
  if (globalAnalytics) {
    globalAnalytics._cdn = cdn
  }
  ;(window as any)._globalAnalyticsCDN = cdn
}
