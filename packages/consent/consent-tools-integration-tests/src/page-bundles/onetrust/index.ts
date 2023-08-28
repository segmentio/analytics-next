import { AnalyticsBrowser } from '@segment/analytics-next'
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
void window.analytics.page().then(console.log)
