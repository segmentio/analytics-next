import { OneTrustGlobal } from '../lib/onetrust-api'
import { addMockImplementation } from './utils'
import type { AnyAnalytics } from '@segment/analytics-consent-tools'
/**
 * This can be used to mock the OneTrust global object in individual tests
 * @example
 * ```ts
 * import * as OneTrustAPI from '../onetrust-api'
 * jest.spyOn(OneTrustAPI, 'getOneTrustGlobal').mockImplementation(() => OneTrustMockGlobal)
 * ````
 */
export const OneTrustMockGlobal: jest.Mocked<OneTrustGlobal> = {
  GetDomainData: jest.fn(),
  IsAlertBoxClosed: jest.fn(),
  OnConsentChanged: jest.fn(),
}

export const analyticsMock: jest.Mocked<AnyAnalytics> = {
  addSourceMiddleware: jest.fn(),
  load: jest.fn(),
  on: jest.fn(),
  track: jest.fn(),
}

addMockImplementation(OneTrustMockGlobal)
addMockImplementation(analyticsMock)
