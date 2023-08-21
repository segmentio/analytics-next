import { OneTrustGlobal } from '../lib/onetrust-api'
import { throwNotImplemented } from './utils'
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
  GetDomainData: jest.fn().mockImplementation(throwNotImplemented),
  IsAlertBoxClosed: jest.fn().mockImplementation(throwNotImplemented),
  OnConsentChanged: jest.fn().mockImplementation(throwNotImplemented), // not implemented atm
}

export const analyticsMock: jest.Mocked<AnyAnalytics> = {
  addSourceMiddleware: jest.fn().mockImplementation(throwNotImplemented),
  load: jest.fn().mockImplementation(throwNotImplemented),
  on: jest.fn().mockImplementation(throwNotImplemented),
  track: jest.fn().mockImplementation(throwNotImplemented),
}
