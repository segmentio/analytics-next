import {
  createError,
  createSuccess,
  TestFetchClient,
} from './test-helpers/factories'
import { createTestAnalytics } from './test-helpers/create-test-analytics'
import { assertHttpRequestEmittedEvent } from './test-helpers/assert-shape'

describe('http_request', () => {
  const testClient = new TestFetchClient()
  it('emits an http_request event if success', async () => {
    testClient.returnValue = createSuccess()
    const analytics = createTestAnalytics()
    const fn = jest.fn()
    analytics.on('http_request', fn)
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(fn).toBeCalledTimes(1)
    assertHttpRequestEmittedEvent(fn.mock.lastCall[0])
  })

  it('emits an http_request event if error', async () => {
    testClient.returnValue = createError()
    const analytics = createTestAnalytics({
      maxRetries: 0,
      customClient: testClient,
    })
    const fn = jest.fn()
    analytics.on('http_request', fn)
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    assertHttpRequestEmittedEvent(fn.mock.lastCall[0])
  })

  it('if error, emits an http_request event on every retry', async () => {
    testClient.returnValue = createError()
    const analytics = createTestAnalytics({
      maxRetries: 2,
      customClient: testClient,
    })
    const fn = jest.fn()
    analytics.on('http_request', fn)
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(fn).toBeCalledTimes(3)
  })
})
