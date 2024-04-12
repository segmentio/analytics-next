import { AnalyticsBrowser } from '@segment/analytics-next'
import { initMockConsentManager } from '../helpers/mock-cmp'
import { withMockCMP } from '../helpers/mock-cmp-wrapper'

initMockConsentManager({ isOptIn: true })

const analytics = new AnalyticsBrowser()

// for testing
;(window as any).analytics = analytics

withMockCMP(analytics).load({
  writeKey: 'foo',
})
