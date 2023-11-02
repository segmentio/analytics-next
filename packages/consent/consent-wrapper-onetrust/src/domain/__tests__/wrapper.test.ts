import * as ConsentTools from '@segment/analytics-consent-tools'
import * as OneTrustAPI from '../../lib/onetrust-api'
import { sleep } from '@internal/test-helpers'
import { withOneTrust } from '../wrapper'
import {
  OneTrustMockGlobal,
  analyticsMock,
  domainDataMock,
  domainGroupMock,
} from '../../test-helpers/mocks'

const getConsentedGroupIdsSpy = jest
  .spyOn(OneTrustAPI, 'getConsentedGroupIds')
  .mockImplementationOnce(() => {
    throw new Error('not implemented')
  })

const createWrapperSpyHelper = {
  _spy: jest.spyOn(ConsentTools, 'createWrapper'),
  get shouldLoadWrapper() {
    return createWrapperSpyHelper._spy.mock.lastCall[0].shouldLoadWrapper!
  },
  get shouldLoadSegment() {
    return createWrapperSpyHelper._spy.mock.lastCall[0].shouldLoadSegment!
  },
  get getCategories() {
    return createWrapperSpyHelper._spy.mock.lastCall[0].getCategories!
  },
  get registerOnConsentChanged() {
    return createWrapperSpyHelper._spy.mock.lastCall[0]
      .registerOnConsentChanged!
  },
}
/**
 * These tests are not meant to be comprehensive, but they should cover the most important cases.
 * We should prefer unit tests for most functionality (see lib/__tests__)
 */
describe('High level "integration" tests', () => {
  let checkResolveWhen = () => {}
  beforeEach(() => {
    jest
      .spyOn(OneTrustAPI, 'getOneTrustGlobal')
      .mockImplementation(() => OneTrustMockGlobal)
    getConsentedGroupIdsSpy.mockReset()
    Object.values(OneTrustMockGlobal).forEach((fn) => fn.mockReset())
    /**
     * Typically, resolveWhen triggers when a predicate is true. We can manually 'check' so we don't have to use timeouts.
     */
    jest.spyOn(ConsentTools, 'resolveWhen').mockImplementation(async (fn) => {
      return new Promise((_resolve, _reject) => {
        checkResolveWhen = () => {
          fn() ? _resolve() : _reject('predicate failed.')
        }
      })
    })
  })

  describe('shouldLoadSegment', () => {
    it('should load if alert box is closed and groups are defined', async () => {
      withOneTrust(analyticsMock)

      const shouldLoadSegment = Promise.resolve(
        createWrapperSpyHelper.shouldLoadSegment({} as any)
      )
      OneTrustMockGlobal.GetDomainData.mockReturnValueOnce(domainDataMock)
      OneTrustMockGlobal.IsAlertBoxClosed.mockReturnValueOnce(true)
      getConsentedGroupIdsSpy.mockImplementation(() => [
        domainGroupMock.StrictlyNeccessary.CustomGroupId,
      ])
      checkResolveWhen()
      await expect(shouldLoadSegment).resolves.toBeUndefined()
    })

    it('should not load at all if no groups are defined', async () => {
      withOneTrust(analyticsMock)
      getConsentedGroupIdsSpy.mockImplementation(() => [])
      const shouldLoadSegment = Promise.resolve(
        createWrapperSpyHelper.shouldLoadSegment({} as any)
      )
      void shouldLoadSegment.catch(() => {})
      OneTrustMockGlobal.IsAlertBoxClosed.mockReturnValueOnce(true)
      checkResolveWhen()
      await expect(shouldLoadSegment).rejects.toEqual(expect.anything())
    })

    it("should load regardless of AlertBox status if showAlertNotice is true (e.g. 'show banner is unchecked')", async () => {
      withOneTrust(analyticsMock)
      OneTrustMockGlobal.GetDomainData.mockReturnValueOnce({
        ...domainDataMock,
        ShowAlertNotice: false, // meaning, it's open
      })
      getConsentedGroupIdsSpy.mockImplementation(() => [
        domainGroupMock.StrictlyNeccessary.CustomGroupId,
      ])
      const shouldLoadSegment = Promise.resolve(
        createWrapperSpyHelper.shouldLoadSegment({} as any)
      )
      OneTrustMockGlobal.IsAlertBoxClosed.mockReturnValueOnce(false) // alert box is _never open
      checkResolveWhen()
      await expect(shouldLoadSegment).resolves.toBeUndefined()
    })
  })

  describe('getCategories', () => {
    it('should get categories successfully', async () => {
      withOneTrust(analyticsMock)
      OneTrustMockGlobal.GetDomainData.mockReturnValue({
        ...domainDataMock,
        Groups: [
          domainGroupMock.StrictlyNeccessary,
          domainGroupMock.Performance,
          domainGroupMock.Targeting,
        ],
      })
      getConsentedGroupIdsSpy.mockImplementation(() => [
        domainGroupMock.StrictlyNeccessary.CustomGroupId,
      ])
      const categories = createWrapperSpyHelper.getCategories()
      // contain both consented and denied category
      expect(categories).toEqual({
        C0001: true,
        C0004: false,
        C0005: false,
      })
    })
  })

  describe('Consent changed', () => {
    it('should enable consent changed by default', async () => {
      withOneTrust(analyticsMock)
      OneTrustMockGlobal.GetDomainData.mockReturnValue({
        ...domainDataMock,
        Groups: [
          domainGroupMock.StrictlyNeccessary,
          domainGroupMock.Performance,
          domainGroupMock.Targeting,
        ],
      })
      const onCategoriesChangedCb = jest.fn()

      void createWrapperSpyHelper.shouldLoadWrapper()
      createWrapperSpyHelper.registerOnConsentChanged(onCategoriesChangedCb)
      onCategoriesChangedCb()

      checkResolveWhen() // wait for OneTrust global to be available
      await sleep(0)

      analyticsMock.track.mockImplementationOnce(() => {}) // ignore track event sent by consent changed

      const onConsentChangedArg =
        OneTrustMockGlobal.OnConsentChanged.mock.lastCall[0]
      onConsentChangedArg(
        new CustomEvent('', {
          detail: [
            domainGroupMock.StrictlyNeccessary.CustomGroupId,
            domainGroupMock.Performance.CustomGroupId,
          ],
        })
      )

      // expect to be normalized!
      expect(onCategoriesChangedCb.mock.lastCall[0]).toEqual({
        [domainGroupMock.StrictlyNeccessary.CustomGroupId]: true,
        [domainGroupMock.Performance.CustomGroupId]: true,
        [domainGroupMock.Targeting.CustomGroupId]: false,
      })
    })
  })
})
