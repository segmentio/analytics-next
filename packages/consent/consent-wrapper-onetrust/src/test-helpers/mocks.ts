import { OneTrustGlobal } from '../lib/onetrust-api'
import { throwNotImplemented } from './utils'

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
