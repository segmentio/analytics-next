import { AnalyticsBrowser } from '@segment/analytics-next'
import { initMockConsentManager } from '../helpers/mock-cmp'
import { withMockCMP } from '../helpers/mock-cmp-wrapper'

initMockConsentManager({
  consentModel: 'opt-in',
})
//import { withOneTrust } from '@segment/analytics-consent-wrapper-onetrust'

// declare global {
//   interface Window {
//     withOneTrust: typeof import('@segment/analytics-consent-wrapper-onetrust').withOneTrust
//   }
// }
// window.withOneTrust = withOneTrust

const analytics = new AnalyticsBrowser()

withMockCMP(analytics).load(
  {
    writeKey: 'foo',
  },
  { initialPageview: true }
)
;(window as any).analytics = analytics
