import { AnalyticsBrowser } from '@segment/analytics-next'
import { withOneTrust } from '@segment/analytics-consent-wrapper-onetrust'

declare global {
  interface Window {
    withOneTrust: typeof import('@segment/analytics-consent-wrapper-onetrust').withOneTrust
  }
}
window.withOneTrust = withOneTrust

const analytics = new AnalyticsBrowser()

withOneTrust(analytics).load(
  {
    writeKey: 'foo',
  },
  { initialPageview: true }
)
;(window as any).analytics = analytics
