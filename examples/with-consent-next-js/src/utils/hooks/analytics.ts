import { usePathname, useParams } from 'next/navigation'
import { useEffect } from 'react'
import { AnalyticsBrowser } from '@segment/analytics-next'
import { oneTrust } from '@segment/analytics-consent-wrapper-onetrust'
import getConfig from 'next/config'

export const analytics = new AnalyticsBrowser()

// only run on client
export const useLoadAnalytics = (writeKey: string) => {
  useEffect(() => {
    const config = getConfig()
    // load the the OneTrust CMP.
    oneTrust(analytics, config.ONE_TRUST_OPTIONS)

    // Set analytics to load when the OneTrust CMP has consent information.
    analytics.load({ writeKey })

    // Just for debugging purposes
    ;(window.analytics as any) = analytics
  }, [writeKey])
}

export const useAnalyticsPageEvent = () => {
  const pathname = usePathname()
  const searchParams = useParams()

  useEffect(() => {
    analytics.page(undefined, undefined, {
      // explicitly passing in the page values here so they get stored in the buffer.
      // this prevents the page properties being out of date if any navigation events happen before analytics is fully loaded / consent is given.
      search: window.location.search,
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer,
      title: document.title,
    })
  }, [pathname, searchParams])
}
