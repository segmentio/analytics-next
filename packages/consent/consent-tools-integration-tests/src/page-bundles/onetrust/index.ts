import { AnalyticsBrowser } from '@segment/analytics-next'
import { withMockCMP } from '../helpers/mock-cmp-wrapper'

const analytics = new AnalyticsBrowser()

withMockCMP(analytics).load(
  {
    writeKey: 'foo',
  },
  { initialPageview: true }
)
;(window as any).analytics = analytics
