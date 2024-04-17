import {
  OneTrustDomainData,
  OneTrustGlobal,
  OtConsentModel,
} from '../lib/onetrust-api'
import type { AnyAnalytics } from '@segment/analytics-consent-tools'
/**
 * This can be used to mock the OneTrust global object in individual tests
 * @example
 * ```ts
 * import * as OneTrustAPI from '../onetrust-api'
 * jest.spyOn(OneTrustAPI, 'getOneTrustGlobal').mockImplementation(() => OneTrustMockGlobal)
 * ````
 */

export const analyticsMock: jest.Mocked<AnyAnalytics> = {
  page: jest.fn(),
  addSourceMiddleware: jest.fn(),
  addDestinationMiddleware: jest.fn(),
  load: jest.fn(),
  track: jest.fn(),
}

export const domainGroupMock = {
  StrictlyNeccessary: {
    CustomGroupId: 'C0001',
  },
  Targeting: {
    CustomGroupId: 'C0004',
  },
  Performance: {
    CustomGroupId: 'C0005',
  },
}

export const domainDataMock: jest.Mocked<OneTrustDomainData> = {
  Groups: [domainGroupMock.StrictlyNeccessary],
  ConsentModel: {
    Name: OtConsentModel.optIn,
  },
  ShowAlertNotice: true,
}

export const OneTrustMockGlobal: jest.Mocked<OneTrustGlobal> = {
  GetDomainData: jest.fn().mockReturnValue(domainDataMock),
  IsAlertBoxClosed: jest.fn(),
  OnConsentChanged: jest.fn(),
}
