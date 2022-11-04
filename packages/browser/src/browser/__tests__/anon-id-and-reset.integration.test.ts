import unfetch from 'unfetch'
import { AnalyticsBrowser } from '..'
import {
  clearAjsBrowserStorage,
  getAnonId,
} from '../../test-helpers/browser-storage'
import { createSuccess } from '../../test-helpers/factories'

jest.mock('unfetch')
const helpers = {
  mockFetchSettingsSuccessResponse: () => {
    return jest
      .mocked(unfetch)
      .mockImplementation(() => createSuccess({ integrations: {} }))
  },
  loadAnalytics() {
    return AnalyticsBrowser.load({ writeKey: 'foo' })
  },
}

beforeEach(() => {
  helpers.mockFetchSettingsSuccessResponse()
})

describe('anonymousId', () => {
  describe('setting implicitly', () => {
    it('is set if an event like track is called during pre-init period', async () => {
      const analytics = helpers.loadAnalytics()
      const ctx = await analytics.track('foo')
      const id = getAnonId()
      expect(id).toBeDefined()
      expect(ctx.event.anonymousId).toBe(id)
    })

    it('sets the global anonymousId to the anonymousId set by the most recent event', async () => {
      const analytics = helpers.loadAnalytics()
      const trackCtx = await analytics.track(
        'add to cart',
        {},
        { anonymousId: 'foo' }
      )
      expect(getAnonId()).toBe('foo')
      expect(trackCtx.event.anonymousId).toBe('foo')
      const idCtx = await analytics.identify('john')
      expect(getAnonId()).toBe('foo')
      expect(idCtx.event.anonymousId).toBe('foo')
    })
  })

  describe('reset', () => {
    beforeEach(() => {
      clearAjsBrowserStorage()
    })

    it('clears anonId if reset is called during pre-init period', async () => {
      const analytics = helpers.loadAnalytics()
      const track = analytics.track('foo')
      const reset = analytics.reset()
      await Promise.all([track, reset])
      expect(getAnonId()).toBeFalsy()
    })

    it('clears anonId if reset is called after initialization is complete', async () => {
      const [analytics] = await helpers.loadAnalytics()
      expect(getAnonId()).toBeFalsy()
      const track = analytics.track('foo')
      expect(typeof getAnonId()).toBe('string')
      analytics.reset()
      expect(getAnonId()).toBeFalsy()
      await track
      expect(getAnonId()).toBeFalsy()
    })
  })
})
