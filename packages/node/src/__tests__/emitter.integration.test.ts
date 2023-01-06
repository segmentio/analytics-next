const fetcher = jest.fn()
jest.mock('../lib/fetch', () => ({ fetch: fetcher }))

import { createError, createSuccess } from './test-helpers/factories'
import { createTestAnalytics } from './test-helpers/create-test-analytics'
import { assertHttpRequestEmittedEvent } from './test-helpers/assert-shape'

describe('Emitter tests', () => {
  it('emits an http_request event if success', async () => {
    fetcher.mockReturnValue(createSuccess())
    const analytics = createTestAnalytics()
    const fn = jest.fn()
    analytics.on('http_request', fn)
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(fn).toBeCalledTimes(1)
    const [req] = fn.mock.lastCall
    console.log(req)
    const body = JSON.parse(req.body)
    expect(Array.isArray(body.batch)).toBeTruthy()
    expect(body.batch.length).toBe(1)
    expect(typeof req.headers).toBe('object')
    expect(typeof req.method).toBe('string')
    expect(typeof req.url).toBe('string')
  })

  it('emits an http_request event if error', async () => {
    fetcher.mockReturnValue(createError())
    const analytics = createTestAnalytics({ maxRetries: 0 })
    const fn = jest.fn()
    analytics.on('http_request', fn)
    await new Promise((resolve) =>
      analytics.track({ anonymousId: 'foo', event: 'bar' }, resolve)
    )
    expect(fn).toBeCalledTimes(1)
    assertHttpRequestEmittedEvent(fn.mock.lastCall[0])
  })
})
