import {
  createTestAnalytics,
  TestFetchClient,
} from './test-helpers/create-test-analytics'

describe('disable', () => {
  const httpClient = new TestFetchClient()
  const mockSend = jest.spyOn(httpClient, 'send')

  it('should dispatch callbacks and emit an http request, even if disabled', async () => {
    const analytics = createTestAnalytics({
      disable: true,
    })
    const emitterCb = jest.fn()
    analytics.on('http_request', emitterCb)
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(emitterCb).toBeCalledTimes(1)
  })

  it('should call .send if disabled is false', async () => {
    const analytics = createTestAnalytics({
      disable: false,
      httpClient: httpClient,
    })
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(mockSend).toBeCalledTimes(1)
  })
  it('should not call .send if disabled is true', async () => {
    const analytics = createTestAnalytics({
      disable: true,
      httpClient: httpClient,
    })
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(mockSend).not.toBeCalled()
  })
})
