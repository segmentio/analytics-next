import * as ConsentTools from '@segment/analytics-consent-tools'
import * as OneTrustAPI from '../../lib/onetrust-api'
import { sleep } from '@internal/test-helpers'

const throwNotImplemented = (): never => {
  throw new Error('not implemented')
}

const grpFixture = {
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

/**
 * This can be used to mock the OneTrust global object in individual tests
 */
const OneTrustMockGlobal: jest.Mocked<OneTrustAPI.OneTrustGlobal> = {
  GetDomainData: jest.fn().mockImplementationOnce(throwNotImplemented),
  IsAlertBoxClosed: jest.fn().mockImplementationOnce(() => false),
  onConsentChanged: jest.fn(), // not implemented atm
}

const getConsentedGroupIdsSpy = jest
  .spyOn(OneTrustAPI, 'getConsentedGroupIds')
  .mockImplementationOnce(throwNotImplemented)

const helpers = {
  _createWrapperSpy: jest.spyOn(ConsentTools, 'createWrapper'),
  get shouldLoad() {
    return helpers._createWrapperSpy.mock.lastCall[0].shouldLoad!
  },
  get getCategories() {
    return helpers._createWrapperSpy.mock.lastCall[0].getCategories!
  },
}

import { oneTrust } from '../wrapper'

/**
 * These tests are not meant to be comprehensive, but they should cover the most important cases.
 * We should prefer unit tests for most functionality (see lib/__tests__)
 */
describe('High level "integration" tests', () => {
  beforeEach(() => {
    oneTrust({} as any)
    getConsentedGroupIdsSpy.mockReset()
    Object.values(OneTrustMockGlobal).forEach((fn) => fn.mockReset())
    jest
      .spyOn(OneTrustAPI, 'getOneTrustGlobal')
      .mockImplementation(() => OneTrustMockGlobal)
  })

  describe('shouldLoad', () => {
    /**
     * Typically, resolveWhen triggers when a predicate is true. We can manually 'check' so we don't have to use timeouts.
     */
    let resolveResolveWhen = () => {}
    jest.spyOn(ConsentTools, 'resolveWhen').mockImplementation(async (fn) => {
      return new Promise((_resolve) => {
        resolveResolveWhen = () => {
          if (fn()) {
            _resolve()
          } else {
            throw new Error('Refuse to resolve, resolveWhen condition is false')
          }
        }
      })
    })

    it('should be resolved successfully', async () => {
      OneTrustMockGlobal.GetDomainData.mockReturnValueOnce({
        Groups: [grpFixture.StrictlyNeccessary, grpFixture.Performance],
      })
      getConsentedGroupIdsSpy.mockImplementation(() => [
        grpFixture.StrictlyNeccessary.CustomGroupId,
      ])
      const shouldLoadP = Promise.resolve(helpers.shouldLoad({} as any))
      let shouldLoadResolved = false
      void shouldLoadP.then(() => (shouldLoadResolved = true))
      await sleep(0)
      expect(shouldLoadResolved).toBe(false)
      OneTrustMockGlobal.IsAlertBoxClosed.mockReturnValueOnce(true)
      resolveResolveWhen()
      const result = await shouldLoadP
      expect(result).toBe(undefined)
    })
  })

  describe('getCategories', () => {
    it('should get categories successfully', async () => {
      OneTrustMockGlobal.GetDomainData.mockReturnValue({
        Groups: [
          grpFixture.StrictlyNeccessary,
          grpFixture.Performance,
          grpFixture.Targeting,
        ],
      })
      getConsentedGroupIdsSpy.mockImplementation(() => [
        grpFixture.StrictlyNeccessary.CustomGroupId,
      ])
      const categories = helpers.getCategories()
      // contain both consented and denied category
      expect(categories).toEqual({
        C0001: true,
        C0004: false,
        C0005: false,
      })
    })
  })
})
