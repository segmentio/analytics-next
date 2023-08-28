/* eslint-disable @typescript-eslint/no-floating-promises */
import { withOneTrust } from '@segment/analytics-consent-wrapper-onetrust'

withOneTrust(window.analytics, {
  integrationCategoryMappings: {
    Fullstory: ['C0001'],
    'Actions Amplitude': ['C0004'],
  },
})

window.analytics.load('9lSrez3BlfLAJ7NOChrqWtILiATiycoc')
window.analytics.track('Hello from the snippet')
