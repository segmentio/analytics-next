import { AnalyticsBrowser } from '@segment/analytics-next'
import { createWrapper } from '@segment/analytics-consent-tools'

const fakeCategories = { Advertising: true, Analytics: true }

const withCMP = createWrapper({
  getCategories: () => fakeCategories,
  integrationCategoryMappings: {
    Fullstory: ['Analytics'],
    'Actions Amplitude': ['Advertising'],
  },
})

const analytics = new AnalyticsBrowser()

withCMP(analytics).load({
  writeKey: 'foo',
})

// for testing
;(window as any).analytics = analytics
