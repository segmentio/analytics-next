const fetch = jest.fn()
jest.mock('unfetch', () => {
  return fetch
})

import { segmentio, SegmentioSettings } from '..'
import { Analytics } from '../../../core/analytics'
import { Plugin } from '../../../core/plugin'
import { envEnrichment } from '../../env-enrichment'
import * as PQ from '../../../lib/priority-queue'
import { createError, createSuccess } from '../../../test-helpers/factories'
import { cdnSettingsMinimal } from '../../../test-helpers/fixtures'

describe('Segment.io retries 500s and 429', () => {
  let options: SegmentioSettings
  let analytics: Analytics
  let segment: Plugin
  beforeEach(async () => {
    jest.useRealTimers()
    jest.resetAllMocks()
    jest.restoreAllMocks()

    options = { apiKey: 'foo' }
    analytics = new Analytics({ writeKey: options.apiKey })
    segment = await segmentio(
      analytics,
      options,
      cdnSettingsMinimal.integrations
    )
    await analytics.register(segment, envEnrichment)
  })

  test('retries on 500', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    fetch.mockReturnValue(createError({ status: 500 }))
    const ctx = await analytics.track('event')
    jest.runAllTimers()

    expect(ctx.attempts).toBeGreaterThanOrEqual(3) // Gets incremented after use
    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(fetch.mock.lastCall[1].body).toContain('"retryCount":')
  })

  test('delays retry on 429', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    const headers = new Headers()
    const resetTime = 1234
    headers.set('x-ratelimit-reset', resetTime.toString())
    fetch
      .mockReturnValueOnce(
        createError({
          status: 429,
          statusText: 'Too Many Requests',
          headers: headers,
        })
      )
      .mockReturnValue(createSuccess({}))
    const spy = jest.spyOn(PQ.PriorityQueue.prototype, 'pushWithBackoff')
    await analytics.track('event')
    expect(spy).toHaveBeenLastCalledWith(expect.anything(), resetTime * 1000)
  })
})

describe('Batches retry 500s and 429', () => {
  let options: SegmentioSettings
  let analytics: Analytics
  let segment: Plugin
  beforeEach(async () => {
    jest.useRealTimers()
    jest.resetAllMocks()
    jest.restoreAllMocks()

    options = {
      apiKey: 'foo',
      deliveryStrategy: {
        strategy: 'batching',
        // timeout is set very low to get consistent behavior out of scheduleflush
        config: { size: 3, timeout: 1, maxRetries: 2 },
      },
    }
    analytics = new Analytics({ writeKey: options.apiKey })
    segment = await segmentio(
      analytics,
      options,
      cdnSettingsMinimal.integrations
    )
    await analytics.register(segment, envEnrichment)
  })

  test('retries on 500', async () => {
    fetch
      .mockReturnValueOnce(createError({ status: 500 }))
      .mockReturnValue(createSuccess({}))

    await analytics.track('event1')
    const ctx = await analytics.track('event2')
    // wait a bit for retries - timeout is only 1 ms
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(ctx.attempts).toBe(2)
    expect(analytics.queue.queue.getAttempts(ctx)).toBe(1)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  test('delays retry on 429', async () => {
    const headers = new Headers()
    const resetTime = 1
    headers.set('x-ratelimit-reset', resetTime.toString())
    fetch.mockReturnValue(
      createError({
        status: 429,
        statusText: 'Too Many Requests',
        headers: headers,
      })
    )

    await analytics.track('event1')
    const ctx = await analytics.track('event2')

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(ctx.attempts).toBe(2)
    expect(fetch).toHaveBeenCalledTimes(1)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(fetch).toHaveBeenCalledTimes(2)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(fetch).toHaveBeenCalledTimes(3)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(fetch).toHaveBeenCalledTimes(3) // capped at 2 retries (+ intial attempt)
    // Check the metadata about retry count
    expect(fetch.mock.lastCall[1].body).toContain('"retryCount":2')
  })
})
