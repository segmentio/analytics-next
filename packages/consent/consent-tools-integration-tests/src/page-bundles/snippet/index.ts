/* eslint-disable @typescript-eslint/no-floating-promises */
import { AnyAnalytics } from '@segment/analytics-consent-tools'
import { oneTrust } from '@segment/analytics-consent-wrapper-onetrust'
import { getGlobalAnalytics } from '@segment/analytics-next'

oneTrust(getGlobalAnalytics() as AnyAnalytics, {
  integrationCategoryMappings: {
    Fullstory: ['C0001'],
    'Actions Amplitude': ['C0004'],
  },
})

getGlobalAnalytics()?.load('9lSrez3BlfLAJ7NOChrqWtILiATiycoc')
getGlobalAnalytics()?.track('Hello from the snippet')
