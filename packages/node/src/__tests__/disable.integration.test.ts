const fetcher = jest.fn()
jest.mock('../lib/fetch', () => ({ fetch: fetcher }))

import { createTestAnalytics } from './test-helpers/create-test-analytics'

describe('disable', () => {
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
    })
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(fetcher).toBeCalled()
  })
  it('should not call fetch if disabled is true', async () => {
    const analytics = createTestAnalytics({
      disable: true,
    })
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(fetcher).not.toBeCalled()
  })
})
