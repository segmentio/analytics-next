import { sleep } from '@segment/analytics-core'
import { getBufferedPageCtxFixture } from '../../test-helpers/fixtures'
import unfetch from 'unfetch'
import { AnalyticsBrowser } from '..'
import { Analytics } from '../../core/analytics'
import { createSuccess } from '../../test-helpers/factories'

jest.mock('unfetch')

const mockFetchSettingsSuccessResponse = () => {
  return jest
    .mocked(unfetch)
    .mockImplementation(() => createSuccess({ integrations: {} }))
}

describe('Lazy initialization', () => {
  let trackSpy: jest.SpiedFunction<Analytics['track']>
  let fetched: jest.MockedFn<typeof unfetch>
  beforeEach(() => {
    fetched = mockFetchSettingsSuccessResponse()
    trackSpy = jest.spyOn(Analytics.prototype, 'track')
  })

  it('Should be able to delay initialization ', async () => {
    const analytics = new AnalyticsBrowser()
    const track = analytics.track('foo')
    await sleep(100)
    expect(trackSpy).not.toBeCalled()
    analytics.load({ writeKey: 'abc' })
    await track
    expect(trackSpy).toBeCalledWith('foo', getBufferedPageCtxFixture())
  })

  it('.load method return an analytics instance', async () => {
    const analytics = new AnalyticsBrowser().load({ writeKey: 'foo' })
    expect(analytics instanceof AnalyticsBrowser).toBeTruthy()
  })

  it('should ignore subsequent .load calls', async () => {
    const analytics = new AnalyticsBrowser()
    await analytics.load({ writeKey: 'my-write-key' })
    await analytics.load({ writeKey: 'def' })
    expect(fetched).toBeCalledTimes(1)
    expect(fetched).toBeCalledWith(
      expect.stringContaining(
        'https://cdn.segment.com/v1/projects/my-write-key/settings'
      )
    )
  })
})
