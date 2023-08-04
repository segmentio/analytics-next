import { usePathname, useParams } from 'next/navigation'
import { useEffect } from 'react'
import { AnalyticsBrowser } from '@segment/analytics-next'
import { oneTrust } from '@segment/analytics-consent-wrapper-onetrust'
import { getWriteKeyFromQueryString } from './write-key'
import { getConfig } from './config'

export const analytics = new AnalyticsBrowser()

// only run on client
if (typeof window !== 'undefined') {
  const config = getConfig()
  if (config.oneTrustOptions.integrationCategoryMappings) {
    console.log(
      'integrationCategoryMappings hardcoded',
      config.oneTrustOptions.integrationCategoryMappings
    )
  } else {
    console.log(
      'Consent Category mappings assumed to be configured on Segment.io.'
    )
  }

  // load the the OneTrust CMP.
  oneTrust(analytics, config.oneTrustOptions)

  // load analytics
  analytics.load({ writeKey: config.writeKey })

  // Skip this step... this is just for the debugging purposes...
  ;(window.analytics as any) = analytics
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
