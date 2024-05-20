import { AnalyticsBrowser } from '@segment/analytics-next'
import { initMockConsentManager } from '../helpers/mock-cmp'
import { withMockCMP } from '../helpers/mock-cmp-wrapper'

initMockConsentManager({
  consentModel: 'opt-out',
})

const analytics = new AnalyticsBrowser()

withMockCMP(analytics).load(
  {
    writeKey: '9lSrez3BlfLAJ7NOChrqWtILiATiycoc',
  },
  { initialPageview: true }
)
;(window as any).analytics = analytics
