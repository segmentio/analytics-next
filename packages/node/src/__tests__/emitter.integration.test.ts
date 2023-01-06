const fetcher = jest.fn()
jest.mock('../lib/fetch', () => ({ fetch: fetcher }))

import { createError, createSuccess } from './test-helpers/factories'
import { createTestAnalytics } from './test-helpers/create-test-analytics'
import { assertHttpRequestEmittedEvent } from './test-helpers/assert-shape'

describe('http_request', () => {
  it('emits an http_request event if success', async () => {
    fetcher.mockReturnValue(createSuccess())
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
    fetcher.mockReturnValue(createError())
    const analytics = createTestAnalytics({ maxRetries: 0 })
    const fn = jest.fn()
    analytics.on('http_request', fn)
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    assertHttpRequestEmittedEvent(fn.mock.lastCall[0])
  })

  it('if error, emits an http_request event on every retry', async () => {
    fetcher.mockReturnValue(createError())
    const analytics = createTestAnalytics({ maxRetries: 2 })
    const fn = jest.fn()
    analytics.on('http_request', fn)
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(fn).toBeCalledTimes(3)
  })
})
