import { createTestAnalytics } from './test-helpers/create-test-analytics'
import { TestFetchClient } from './test-helpers/test-fetch-client'

describe('disable', () => {
  const customClient = new TestFetchClient()
  const mockSend = jest.spyOn(customClient, 'send')

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

  it('should call fetch if disabled is false', async () => {
    const analytics = createTestAnalytics({
      disable: false,
      httpClient: customClient,
    })
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(mockSend).toBeCalledTimes(1)
  })
  it('should not call fetch if disabled is true', async () => {
    const analytics = createTestAnalytics({
      disable: true,
      httpClient: customClient,
    })
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(mockSend).toBeCalledTimes(0)
  })
})
