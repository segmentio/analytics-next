import {
  createTestAnalytics,
  TestFetchClient,
} from './test-helpers/create-test-analytics'

describe('disable', () => {
  const httpClient = new TestFetchClient()
  const makeReqSpy = jest.spyOn(httpClient, 'makeRequest')

  it('should not emit an http request if disabled', async () => {
    const analytics = createTestAnalytics({
      disable: true,
    })
    const emitterCb = jest.fn()
    analytics.on('http_request', emitterCb)
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(emitterCb).not.toBeCalled()
  })

  it('should call .send if disabled is false', async () => {
    const analytics = createTestAnalytics({
      disable: false,
      httpClient: httpClient,
    })
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(makeReqSpy).toBeCalledTimes(1)
  })
  it('should not call .send if disabled is true', async () => {
    const analytics = createTestAnalytics({
      disable: true,
      httpClient: httpClient,
    })
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(makeReqSpy).not.toBeCalled()
  })
})
