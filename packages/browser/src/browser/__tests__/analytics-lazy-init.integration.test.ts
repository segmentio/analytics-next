import { sleep } from '@segment/analytics-core'
import unfetch from 'unfetch'
import { AnalyticsBrowser } from '..'
import { Analytics } from '../../core/analytics'
import { createSuccess } from '../../test-helpers/factories'

jest.mock('unfetch')

const mockFetchSettingsSuccessResponse = () => {
  jest
    .mocked(unfetch)
    .mockImplementation(() => createSuccess({ integrations: {} }))
}

describe('Lazy initialization', () => {
  let trackSpy: jest.SpiedFunction<Analytics['track']>
  beforeEach(() => {
    trackSpy = jest.spyOn(Analytics.prototype, 'track')
    mockFetchSettingsSuccessResponse()
  })

  it('Should be able to delay initialization ', async () => {
    const analytics = new AnalyticsBrowser()
    const track = analytics.track('foo')
    await sleep(100)
    expect(trackSpy).not.toBeCalled()
    analytics.load({ writeKey: 'abc' })
    await track
    expect(trackSpy).toBeCalledWith('foo')
  })
  it('load method return an analytics instance', async () => {
    const analytics = new AnalyticsBrowser().load({ writeKey: 'foo' })
    expect(analytics instanceof AnalyticsBrowser).toBeTruthy()
    await analytics.track('foo')
    expect(trackSpy).toBeCalledWith('foo')
  })
})
