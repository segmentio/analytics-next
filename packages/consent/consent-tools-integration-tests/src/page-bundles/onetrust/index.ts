import { AnalyticsBrowser, getGlobalAnalytics } from '@segment/analytics-next'
import { withOneTrust } from '@segment/analytics-consent-wrapper-onetrust'

export const analytics = new AnalyticsBrowser()

withOneTrust(analytics, {
  disableConsentChangedEvent: false,
  integrationCategoryMappings: {
    Fullstory: ['C0001'],
    'Actions Amplitude': ['C0004'],
  },
}).load({ writeKey: '9lSrez3BlfLAJ7NOChrqWtILiATiycoc' })
;(window as any).analytics = analytics

analytics.load({ writeKey: '9lSrez3BlfLAJ7NOChrqWtILiATiycoc' })
void getGlobalAnalytics()?.page().then(console.log)
