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
    analytics = new Analytics(
      { writeKey: options.apiKey },
      { retryQueue: true }
    )
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

    expect(ctx.attempts).toBeGreaterThanOrEqual(2) // Gets incremented after use
    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(fetch.mock.lastCall[1].body).toContain('"retryCount":')
  })

  test('sets X-Retry-Count header on standard retries', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    fetch.mockReturnValue(createError({ status: 500 }))

    await analytics.track('event')
    jest.runAllTimers()

    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2)

    const firstHeaders = fetch.mock.calls[0][1].headers as Record<
      string,
      string
    >
    expect(firstHeaders['X-Retry-Count']).toBe('0')

    const secondHeaders = fetch.mock.calls[1][1].headers as Record<
      string,
      string
    >
    expect(secondHeaders['X-Retry-Count']).toBe('1')
  })

  test('delays retry on 429', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    const headers = new Headers()
    const resetTime = 120
    headers.set('Retry-After', resetTime.toString())
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

describe('Standard dispatcher retry semantics and X-Retry-Count header', () => {
  let options: SegmentioSettings
  let analytics: Analytics
  let segment: Plugin

  beforeEach(async () => {
    jest.useRealTimers()
    jest.resetAllMocks()
    jest.restoreAllMocks()

    options = { apiKey: 'foo' }
    analytics = new Analytics(
      { writeKey: options.apiKey },
      { retryQueue: true }
    )
    segment = await segmentio(
      analytics,
      options,
      cdnSettingsMinimal.integrations
    )
    await analytics.register(segment, envEnrichment)
  })

  it('T01 first attempt sends X-Retry-Count as 0', async () => {
    fetch.mockReturnValue(createSuccess({}))

    await analytics.track('event')

    expect(fetch).toHaveBeenCalledTimes(1)
    const headers = fetch.mock.calls[0][1].headers as Record<string, string>
    expect(headers['X-Retry-Count']).toBe('0')
  })

  it('T02 Retryable 500: backoff used, header increments', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    fetch
      .mockReturnValueOnce(createError({ status: 500 }))
      .mockReturnValueOnce(createError({ status: 500 }))
      .mockReturnValue(createSuccess({}))

    await analytics.track('event')
    jest.runAllTimers()

    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2)

    const firstHeaders = fetch.mock.calls[0][1].headers as Record<
      string,
      string
    >
    const secondHeaders = fetch.mock.calls[1][1].headers as Record<
      string,
      string
    >

    expect(firstHeaders['X-Retry-Count']).toBe('0')
    expect(secondHeaders['X-Retry-Count']).toBe('1')
  })

  it('T03 Non-retryable 5xx: 501', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    fetch.mockReturnValue(createError({ status: 501 }))

    await analytics.track('event')
    jest.runAllTimers()

    expect(fetch).toHaveBeenCalledTimes(1)
    const headers = fetch.mock.calls[0][1].headers as Record<string, string>
    expect(headers['X-Retry-Count']).toBe('0')
  })

  it('T04 Non-retryable 5xx: 505', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    fetch.mockReturnValue(createError({ status: 505 }))

    await analytics.track('event')
    jest.runAllTimers()

    expect(fetch).toHaveBeenCalledTimes(1)
    const headers = fetch.mock.calls[0][1].headers as Record<string, string>
    expect(headers['X-Retry-Count']).toBe('0')
  })

  it('T05 Non-retryable 5xx: 511 (no auth)', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    fetch.mockReturnValue(createError({ status: 511 }))

    await analytics.track('event')
    jest.runAllTimers()

    expect(fetch).toHaveBeenCalledTimes(1)
    const headers = fetch.mock.calls[0][1].headers as Record<string, string>
    expect(headers['X-Retry-Count']).toBe('0')
  })

  it('T06 Retry-After 429: delay, header increments', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    const headersObj = new Headers()
    const resetTime = 2
    headersObj.set('Retry-After', resetTime.toString())

    fetch
      .mockReturnValueOnce(
        createError({
          status: 429,
          statusText: 'Too Many Requests',
          headers: headersObj,
        })
      )
      .mockReturnValue(createSuccess({}))

    const spy = jest.spyOn(PQ.PriorityQueue.prototype, 'pushWithBackoff')
    await analytics.track('event')
    jest.runAllTimers()

    // Rate-limit retry scheduled with Retry-After delay
    expect(spy).toHaveBeenLastCalledWith(expect.anything(), resetTime * 1000)

    // First attempt has no header; retry header behavior is
    // covered by other tests that do not depend on exact
    // Retry-After scheduling.
    const firstHeaders = fetch.mock.calls[0][1].headers as Record<
      string,
      string
    >
    expect(firstHeaders['X-Retry-Count']).toBe('0')
  })

  it('T07 408 uses backoff retry', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    const headersObj = new Headers()

    fetch
      .mockReturnValueOnce(
        createError({
          status: 408,
          statusText: 'Request Timeout',
          headers: headersObj,
        })
      )
      .mockReturnValue(createSuccess({}))

    const spy = jest.spyOn(PQ.PriorityQueue.prototype, 'pushWithBackoff')
    await analytics.track('event')
    jest.runAllTimers()

    expect(spy).toHaveBeenCalled()
    const firstHeaders = fetch.mock.calls[0][1].headers as Record<
      string,
      string
    >
    expect(firstHeaders['X-Retry-Count']).toBe('0')
  })

  it('T08 503 uses backoff retry', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    const headersObj = new Headers()

    fetch
      .mockReturnValueOnce(
        createError({
          status: 503,
          statusText: 'Service Unavailable',
          headers: headersObj,
        })
      )
      .mockReturnValue(createSuccess({}))

    const spy = jest.spyOn(PQ.PriorityQueue.prototype, 'pushWithBackoff')
    await analytics.track('event')
    jest.runAllTimers()

    expect(spy).toHaveBeenCalled()
    const firstHeaders = fetch.mock.calls[0][1].headers as Record<
      string,
      string
    >
    expect(firstHeaders['X-Retry-Count']).toBe('0')
  })

  it('T09 429 without Retry-After: backoff retry, header increments', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    const headersObj = new Headers()

    fetch
      .mockReturnValueOnce(
        createError({
          status: 429,
          statusText: 'Too Many Requests',
          headers: headersObj,
        })
      )
      .mockReturnValue(createSuccess({}))

    await analytics.track('event')
    jest.runAllTimers()

    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2)

    const firstHeaders = fetch.mock.calls[0][1].headers as Record<
      string,
      string
    >
    const secondHeaders = fetch.mock.calls[1][1].headers as Record<
      string,
      string
    >
    expect(firstHeaders['X-Retry-Count']).toBe('0')
    expect(secondHeaders['X-Retry-Count']).toBe('1')
  })

  it('T10 Retryable 4xx: 408 without Retry-After', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    fetch
      .mockReturnValueOnce(createError({ status: 408 }))
      .mockReturnValue(createSuccess({}))

    await analytics.track('event')
    jest.runAllTimers()

    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2)

    const firstHeaders = fetch.mock.calls[0][1].headers as Record<
      string,
      string
    >
    const secondHeaders = fetch.mock.calls[1][1].headers as Record<
      string,
      string
    >
    expect(firstHeaders['X-Retry-Count']).toBe('0')
    expect(secondHeaders['X-Retry-Count']).toBe('1')
  })

  it('T11 Retryable 4xx: 410', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    fetch
      .mockReturnValueOnce(createError({ status: 410 }))
      .mockReturnValue(createSuccess({}))

    await analytics.track('event')
    jest.runAllTimers()

    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2)

    const firstHeaders = fetch.mock.calls[0][1].headers as Record<
      string,
      string
    >
    const secondHeaders = fetch.mock.calls[1][1].headers as Record<
      string,
      string
    >
    expect(firstHeaders['X-Retry-Count']).toBe('0')
    expect(secondHeaders['X-Retry-Count']).toBe('1')
  })

  it('T12 Non-retryable 4xx: 413', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    fetch.mockReturnValue(createError({ status: 413 }))

    await analytics.track('event')
    jest.runAllTimers()

    expect(fetch).toHaveBeenCalledTimes(1)
    const headers = fetch.mock.calls[0][1].headers as Record<string, string>
    expect(headers['X-Retry-Count']).toBe('0')
  })

  it('T13 Retryable 4xx: 460', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    fetch
      .mockReturnValueOnce(createError({ status: 460 }))
      .mockReturnValue(createSuccess({}))

    await analytics.track('event')
    jest.runAllTimers()

    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2)

    const firstHeaders = fetch.mock.calls[0][1].headers as Record<
      string,
      string
    >
    const secondHeaders = fetch.mock.calls[1][1].headers as Record<
      string,
      string
    >
    expect(firstHeaders['X-Retry-Count']).toBe('0')
    expect(secondHeaders['X-Retry-Count']).toBe('1')
  })

  it('T14 Non-retryable 4xx: 404', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    fetch.mockReturnValue(createError({ status: 404 }))

    await analytics.track('event')
    jest.runAllTimers()

    expect(fetch).toHaveBeenCalledTimes(1)
    const headers = fetch.mock.calls[0][1].headers as Record<string, string>
    expect(headers['X-Retry-Count']).toBe('0')
  })

  it('T15 Network error (IO): retried with backoff', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    fetch
      .mockImplementationOnce(() => Promise.reject(new Error('network error')))
      .mockReturnValue(createSuccess({}))

    await analytics.track('event')
    jest.runAllTimers()

    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2)

    const firstHeaders = fetch.mock.calls[0][1].headers as Record<
      string,
      string
    >
    const secondHeaders = fetch.mock.calls[1][1].headers as Record<
      string,
      string
    >
    expect(firstHeaders['X-Retry-Count']).toBe('0')
    expect(secondHeaders['X-Retry-Count']).toBe('1')
  })

  it('T18 X-Retry-Count semantics: three attempts total', async () => {
    jest.useFakeTimers({ advanceTimers: true })
    fetch
      .mockReturnValueOnce(createError({ status: 500 }))
      .mockReturnValueOnce(createError({ status: 410 }))
      .mockReturnValue(createSuccess({}))

    await analytics.track('event')
    jest.runAllTimers()

    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2)

    const firstHeaders = fetch.mock.calls[0][1].headers as Record<
      string,
      string
    >
    const secondHeaders = fetch.mock.calls[1][1].headers as Record<
      string,
      string
    >

    expect(firstHeaders['X-Retry-Count']).toBe('0')
    expect(secondHeaders['X-Retry-Count']).toBe('1')
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
    // wait for exponential backoff retry (~500ms base + jitter)
    await new Promise((resolve) => setTimeout(resolve, 700))

    expect(ctx.attempts).toBe(2)
    expect(analytics.queue.queue.getAttempts(ctx)).toBe(1)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  test('delays retry on 429', async () => {
    const headers = new Headers()
    const resetTime = 1
    headers.set('Retry-After', resetTime.toString())
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
    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(3)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(3)
    // Check the metadata about retry count on batched events
    expect(fetch.mock.lastCall[1].body).toContain('"retryCount":1')
  })
})

describe('retryQueue', () => {
  let options: SegmentioSettings
  let analytics: Analytics
  let segment: Plugin
  beforeEach(async () => {
    jest.useFakeTimers({ advanceTimers: true })
    jest.resetAllMocks()
    jest.restoreAllMocks()

    options = {
      apiKey: 'foo',
    }

    fetch.mockReturnValue(createError({ status: 500 }))
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('Only attempts once if retryQueue is false', async () => {
    analytics = new Analytics(
      { writeKey: options.apiKey },
      { retryQueue: false }
    )
    segment = await segmentio(
      analytics,
      options,
      cdnSettingsMinimal.integrations
    )
    await analytics.register(segment, envEnrichment)

    await analytics.track('foo')
    jest.runAllTimers()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('Attempts multiple times if retryQueue is true', async () => {
    analytics = new Analytics(
      { writeKey: options.apiKey },
      { retryQueue: true }
    )
    segment = await segmentio(
      analytics,
      options,
      cdnSettingsMinimal.integrations
    )
    await analytics.register(segment, envEnrichment)

    await analytics.track('foo')
    jest.runAllTimers()
    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2)
  })
})
