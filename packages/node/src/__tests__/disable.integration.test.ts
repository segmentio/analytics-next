import { createTestAnalytics } from './test-helpers/create-test-analytics'
import { CustomHTTPClient } from '../lib/customhttpclient'

export class CheckFetchClient implements CustomHTTPClient {
  private _wasCalled = false
  get wasCalled() {
    return this._wasCalled
  }
  set wasCalled(value: boolean) {
    this._wasCalled = value
  }
  send = async (_resource: any, _options: any): Promise<Response> => {
    this._wasCalled = true
    return Promise.resolve({
      json: {},
      ok: true,
      status: 200,
      statusText: 'OK',
    }) as Promise<Response>
  }
}

describe('disable', () => {
  const checkFetchClient = new CheckFetchClient()

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
      customClient: checkFetchClient,
    })
    checkFetchClient.wasCalled = false
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(checkFetchClient.wasCalled).toBe(true)
  })
  it('should not call fetch if disabled is true', async () => {
    const analytics = createTestAnalytics({
      disable: true,
      customClient: checkFetchClient,
    })
    checkFetchClient.wasCalled = false
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(checkFetchClient.wasCalled).toBe(false)
  })
})
