import { AnalyticsBrowser } from '@segment/analytics-next'
import { initMockConsentManager } from '../helpers/mock-cmp'
import { withMockCMP } from '../helpers/mock-cmp-wrapper'

initMockConsentManager({ consentModel: 'opt-in' })

const analytics = new AnalyticsBrowser()

// for testing
;(window as any).analytics = analytics

withMockCMP(analytics).load({
  writeKey: 'C8qe7TaOyZburANuEAbA4WovdITZHywg',
})
