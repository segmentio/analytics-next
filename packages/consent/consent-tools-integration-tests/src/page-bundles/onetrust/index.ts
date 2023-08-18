import { AnalyticsBrowser } from '@segment/analytics-next'
import { oneTrust } from '@segment/analytics-consent-wrapper-onetrust'

export const analytics = new AnalyticsBrowser()

oneTrust(analytics, {
  disableConsentChangedEvent: false,
  integrationCategoryMappings: {
    Fullstory: ['C0001'],
    'Actions Amplitude': ['C0004'],
  },
})
;(window as any).analytics = analytics

analytics.load({ writeKey: '9lSrez3BlfLAJ7NOChrqWtILiATiycoc' })
void window.analytics.page().then(console.log)
