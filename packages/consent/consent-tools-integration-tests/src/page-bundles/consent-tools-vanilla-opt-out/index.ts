import { AnalyticsBrowser } from '@segment/analytics-next'
import { initMockConsentManager } from '../helpers/mock-cmp'
import { withMockCMP } from '../helpers/mock-cmp-wrapper'

initMockConsentManager({
  consentModel: 'opt-out',
})

const analytics = new AnalyticsBrowser()

withMockCMP(analytics).load(
  {
    writeKey: 'foo',
  },
  { initialPageview: true }
)
;(window as any).analytics = analytics
