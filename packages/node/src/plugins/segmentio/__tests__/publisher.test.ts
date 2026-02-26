import { Emitter } from '@segment/analytics-generic-utils'
import { range } from 'lodash'
import { createConfiguredNodePlugin } from '..'
import { Context } from '../../../app/context'
import { NodeEventFactory } from '../../../app/event-factory'
import { assertHttpRequestEmittedEvent } from '../../../__tests__/test-helpers/assert-shape'
import {
  createSuccess,
  createError,
} from '../../../__tests__/test-helpers/factories'
import { TestFetchClient } from '../../../__tests__/test-helpers/create-test-analytics'
import { PublisherProps } from '../publisher'
import { assertHTTPRequestOptions } from '../../../__tests__/test-helpers/assert-shape/segment-http-api'
import { HTTPClientRequest } from '../../../lib/http-client'

let emitter: Emitter
const testClient = new TestFetchClient()
const makeReqSpy = jest.spyOn(testClient, 'makeRequest')
const getLastRequest = () => makeReqSpy.mock.lastCall![0]

class TestHeaders implements Headers {
  private headers: Record<string, string>

  constructor() {
    this.headers = {}
  }

  append(name: string, value: string): void {
    if (this.headers[name]) {
      this.headers[name] += `, ${value}`
    } else {
      this.headers[name] = value
    }
  }

  delete(name: string): void {
    delete this.headers[name]
  }

  get(name: string): string | null {
    return this.headers[name] || null
  }

  has(name: string): boolean {
    return name in this.headers
  }

  set(name: string, value: string): void {
    this.headers[name] = value
  }

  forEach(
    callback: (value: string, name: string, parent: Headers) => void
  ): void {
    for (const name in this.headers) {
      callback(this.headers[name], name, this)
    }
  }

  getSetCookie(): string[] {
    // Implement the getSetCookie method here
    return []
  }
}

const createTestNodePlugin = (props: Partial<PublisherProps> = {}) =>
  createConfiguredNodePlugin(
    {
      flushAt: 1,
      httpClient: testClient,
      writeKey: '',
      flushInterval: 1000,
      maxRetries: 3,
      ...props,
    },
    emitter
  )

const validateMakeReqInputs = (...contexts: Context[]) => {
  return assertHTTPRequestOptions(getLastRequest(), contexts)
}

const eventFactory = new NodeEventFactory()

beforeEach(() => {
  emitter = new Emitter()
  makeReqSpy.mockReturnValue(createSuccess())
  jest.useFakeTimers()
})

it('supports multiple events in a batch', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin({
    maxRetries: 3,
    flushAt: 3,
  })

  // Create 3 events of mixed types to send.
  const contexts = [
    eventFactory.track('test event', { foo: 'bar' }, { userId: 'foo-user-id' }),
    eventFactory.alias('to', 'from'),
    eventFactory.identify('foo-user-id', {
      name: 'Chris Radek',
    }),
  ].map((event) => new Context(event))

  for (const context of contexts) {
    // We want batching to happen, so don't await.
    void segmentPlugin[context.event.type](context)
  }

  // Expect a single fetch call for all 3 events.
  expect(makeReqSpy).toHaveBeenCalledTimes(1)

  validateMakeReqInputs(...contexts)
})

it('supports waiting a max amount of time before sending', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin({
    maxRetries: 3,
    flushAt: 3,
  })

  const context = new Context(eventFactory.alias('to', 'from'))

  const pendingContext = segmentPlugin.alias(context)

  jest.advanceTimersByTime(500)

  expect(makeReqSpy).not.toHaveBeenCalled()

  jest.advanceTimersByTime(500)

  // Expect a single fetch call for all 1 events.
  expect(makeReqSpy).toHaveBeenCalledTimes(1)
  validateMakeReqInputs(context)

  // Make sure we're returning the context in the resolved promise.
  const updatedContext = await pendingContext
  expect(updatedContext).toBe(context)
  expect(updatedContext.failedDelivery()).toBeFalsy()
})

it('sends as soon as batch fills up or max time is reached', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin({
    maxRetries: 3,
    flushAt: 2,
  })

  const context = new Context(eventFactory.alias('to', 'from'))

  const contexts: Context[] = []
  // Fill up 1 batch and partially fill another
  for (let i = 0; i < 3; i++) {
    contexts.push(new Context(eventFactory.alias('to', 'from')))
  }

  const pendingContexts = contexts.map((ctx) => segmentPlugin.alias(ctx))

  // Should have seen 1 call due to 1 batch being filled.
  expect(makeReqSpy).toHaveBeenCalledTimes(1)
  validateMakeReqInputs(context, context)

  // 2nd batch is not full, so need to wait for the flushInterval to be reached before sending.
  jest.advanceTimersByTime(500)
  expect(makeReqSpy).toHaveBeenCalledTimes(1)
  jest.advanceTimersByTime(500)
  expect(makeReqSpy).toHaveBeenCalledTimes(2)

  // Make sure we're returning the context in the resolved promise.
  const updatedContexts = await Promise.all(pendingContexts)
  for (let i = 0; i < 3; i++) {
    expect(updatedContexts[i]).toBe(contexts[i])
    expect(updatedContexts[i].failedDelivery()).toBeFalsy()
  }
})

it('sends if batch will exceed max size in bytes when adding event', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin({
    maxRetries: 3,
    flushAt: 20,
    flushInterval: 100,
  })

  const contexts: Context[] = []
  // Max batch size is ~480KB, so adding 16 events with 30KB buffers will hit the limit.
  for (let i = 0; i < 16; i++) {
    contexts.push(
      new Context(
        eventFactory.track(
          'Test Event',
          {
            smallBuffer: Buffer.alloc(30 * 1024).toString(),
            index: i,
          },
          { anonymousId: 'foo' }
        )
      )
    )
  }

  const pendingContexts = contexts.map((ctx) => segmentPlugin.track(ctx))
  expect(makeReqSpy).toHaveBeenCalledTimes(1)
  jest.advanceTimersByTime(100)
  expect(makeReqSpy).toHaveBeenCalledTimes(2)

  const updatedContexts = await Promise.all(pendingContexts)
  for (let i = 0; i < 16; i++) {
    expect(updatedContexts[i]).toBe(contexts[i])
    expect(updatedContexts[i].failedDelivery()).toBeFalsy()
  }
})

describe('flushAfterClose', () => {
  const _createTrackCtx = () =>
    new Context(
      eventFactory.track(
        'test event',
        { foo: 'bar' },
        { userId: 'foo-user-id' }
      )
    )

  it('sends immediately once all pending events reach the segment plugin, regardless of settings like batch size', async () => {
    const _createTrackCtx = () =>
      new Context(
        eventFactory.track(
          'test event',
          { foo: 'bar' },
          { userId: 'foo-user-id' }
        )
      )

    const { plugin: segmentPlugin, publisher } = createTestNodePlugin({
      flushAt: 20,
    })

    publisher.flush(3)

    void segmentPlugin.track(_createTrackCtx())
    void segmentPlugin.track(_createTrackCtx())
    expect(makeReqSpy).toHaveBeenCalledTimes(0)
    void segmentPlugin.track(_createTrackCtx())
    expect(makeReqSpy).toBeCalledTimes(1)
  })

  it('continues to flush on each event if batch size is 1', async () => {
    const { plugin: segmentPlugin, publisher } = createTestNodePlugin({
      flushAt: 1,
    })

    publisher.flush(3)

    void segmentPlugin.track(_createTrackCtx())
    void segmentPlugin.track(_createTrackCtx())
    void segmentPlugin.track(_createTrackCtx())
    expect(makeReqSpy).toBeCalledTimes(3)
  })

  it('sends immediately once there are no pending items, even if pending events exceeds batch size', async () => {
    const { plugin: segmentPlugin, publisher } = createTestNodePlugin({
      flushAt: 3,
    })

    publisher.flush(5)
    range(3).forEach(() => segmentPlugin.track(_createTrackCtx()))
    expect(makeReqSpy).toHaveBeenCalledTimes(1)
    range(2).forEach(() => segmentPlugin.track(_createTrackCtx()))
    expect(makeReqSpy).toHaveBeenCalledTimes(2)
  })

  it('works if there are previous items in the batch', async () => {
    const { plugin: segmentPlugin, publisher } = createTestNodePlugin({
      flushAt: 7,
    })

    range(3).forEach(() => segmentPlugin.track(_createTrackCtx())) // should not flush
    publisher.flush(5)
    range(2).forEach(() => segmentPlugin.track(_createTrackCtx()))
    expect(makeReqSpy).toHaveBeenCalledTimes(1)
  })

  it('works if there are previous items in the batch AND pending items > batch size', async () => {
    const { plugin: segmentPlugin, publisher } = createTestNodePlugin({
      flushAt: 7,
    })

    range(3).forEach(() => segmentPlugin.track(_createTrackCtx())) // should not flush
    expect(makeReqSpy).toHaveBeenCalledTimes(0)
    publisher.flush(10)
    expect(makeReqSpy).toHaveBeenCalledTimes(0)
    range(4).forEach(() => segmentPlugin.track(_createTrackCtx())) // batch is full, send.
    expect(makeReqSpy).toHaveBeenCalledTimes(1)
    range(2).forEach(() => segmentPlugin.track(_createTrackCtx()))
    expect(makeReqSpy).toBeCalledTimes(1)
    void segmentPlugin.track(_createTrackCtx()) // pending items limit has been reached, send.
    expect(makeReqSpy).toBeCalledTimes(2)
  })
})

describe('error handling', () => {
  it('excludes events that are too large', async () => {
    const { plugin: segmentPlugin } = createTestNodePlugin({
      flushAt: 1,
    })

    const context = new Context(
      eventFactory.track(
        'Test Event',
        {
          largeBuffer: Buffer.alloc(500 * 1024).toString(),
        },
        {
          anonymousId: 'foo',
        }
      )
    )

    expect(context.failedDelivery()).toBeFalsy()
    const updatedContext = await segmentPlugin.track(context)
    expect(updatedContext).toBe(context)
    expect(updatedContext.failedDelivery()).toBeTruthy()
    expect(updatedContext.failedDelivery()).toMatchInlineSnapshot(`
      {
        "reason": [Error: Event exceeds maximum event size of 32 KB],
      }
    `)
    expect(makeReqSpy).not.toHaveBeenCalled()
  })

  it('does not retry 400 errors', async () => {
    makeReqSpy.mockReturnValue(
      createError({ status: 400, statusText: 'Bad Request' })
    )

    const { plugin: segmentPlugin } = createTestNodePlugin({
      flushAt: 1,
    })

    const context = new Context(eventFactory.alias('to', 'from'))

    const updatedContext = await segmentPlugin.alias(context)

    expect(makeReqSpy).toHaveBeenCalledTimes(1)
    validateMakeReqInputs(context)

    expect(updatedContext).toBe(context)
    expect(updatedContext.failedDelivery()).toBeTruthy()
    expect(updatedContext.failedDelivery()).toMatchInlineSnapshot(`
      {
        "reason": [Error: [400] Bad Request],
      }
    `)
  })

  it('429 with Retry-After keeps batch pending until retry succeeds', async () => {
    jest.useRealTimers()
    const headers = new TestHeaders()
    const delaySeconds = 1
    headers.set('Retry-After', delaySeconds.toString())
    makeReqSpy
      .mockReturnValueOnce(
        createError({
          status: 429,
          statusText: 'Too Many Requests',
          ...headers,
        })
      )
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const context = new Context(eventFactory.alias('to', 'from'))
    const pendingContext = segmentPlugin.alias(context)
    const updatedContext = await pendingContext
    expect(updatedContext).toBe(context)
    expect(updatedContext.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(2)
  })

  it('retries 500 errors', async () => {
    // Jest kept timing out when using fake timers despite advancing time.
    jest.useRealTimers()

    makeReqSpy.mockReturnValue(
      createError({ status: 500, statusText: 'Internal Server Error' })
    )

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 2,
      flushAt: 1,
    })

    const context = new Context(eventFactory.alias('to', 'from'))

    const pendingContext = segmentPlugin.alias(context)
    const updatedContext = await pendingContext

    expect(makeReqSpy).toHaveBeenCalledTimes(3)
    validateMakeReqInputs(context)

    expect(updatedContext).toBe(context)
    expect(updatedContext.failedDelivery()).toBeTruthy()
    const err = updatedContext.failedDelivery()?.reason as Error
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toEqual(expect.stringContaining('500'))
  })

  it('treats 1xx (<200) statuses as success (no retry)', async () => {
    jest.useRealTimers()

    makeReqSpy.mockReturnValue(
      createError({ status: 100, statusText: 'Continue' })
    )

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 2,
      flushAt: 1,
    })

    const context = new Context(eventFactory.alias('to', 'from'))
    const updatedContext = await segmentPlugin.alias(context)

    expect(makeReqSpy).toHaveBeenCalledTimes(1)
    validateMakeReqInputs(context)
    expect(updatedContext).toBe(context)
    expect(updatedContext.failedDelivery()).toBeFalsy()
  })
  it('retries fetch errors', async () => {
    // Jest kept timing out when using fake timers despite advancing time.
    jest.useRealTimers()

    makeReqSpy.mockRejectedValue(new Error('Connection Error'))

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 2,
      flushAt: 1,
    })

    const context = new Context(eventFactory.alias('my', 'from'))

    const pendingContext = segmentPlugin.alias(context)
    const updatedContext = await pendingContext

    expect(makeReqSpy).toHaveBeenCalledTimes(3)
    validateMakeReqInputs(context)

    expect(updatedContext).toBe(context)
    expect(updatedContext.failedDelivery()).toBeTruthy()
    expect(updatedContext.failedDelivery()).toMatchInlineSnapshot(`
      {
        "reason": [Error: Connection Error],
      }
    `)
  })

  it('should fetch only once if maxRetries is 0', async () => {
    // Jest kept timing out when using fake timers despite advancing time.
    jest.useRealTimers()

    makeReqSpy.mockRejectedValue(new Error('Connection Error'))
    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 0,
      flushAt: 1,
    })

    const fn = jest.fn()
    emitter.on('http_request', fn)

    await segmentPlugin.track(
      new Context(
        eventFactory.track(
          'test event',
          { foo: 'bar' },
          { userId: 'foo-user-id' }
        )
      )
    )
    expect(makeReqSpy).toHaveBeenCalledTimes(1)
  })
})

describe('http_request emitter event', () => {
  it('should emit an http_request object', async () => {
    const { plugin: segmentPlugin } = createTestNodePlugin({
      flushAt: 1,
    })

    makeReqSpy.mockReturnValueOnce(createSuccess())
    const fn = jest.fn()
    emitter.on('http_request', fn)
    const context = new Context(
      eventFactory.track('foo', undefined, { userId: 'foo-user-id' })
    )
    await segmentPlugin.track(context)
    assertHttpRequestEmittedEvent(fn.mock.lastCall[0])
  })
})

describe('retry semantics', () => {
  const trackEvent = () =>
    new Context(
      eventFactory.track(
        'test event',
        { foo: 'bar' },
        { userId: 'foo-user-id' }
      )
    )

  const getAllRequests = () =>
    makeReqSpy.mock.calls.map(([req]) => req as HTTPClientRequest)

  beforeEach(() => {
    jest.useRealTimers()
    makeReqSpy.mockReset()
  })

  it('T01 Success: no retry, header is 0', async () => {
    makeReqSpy.mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(updated.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(1)
    const [req] = getAllRequests()
    expect(req.headers['X-Retry-Count']).toBe('0')
  })

  it('T02 Retryable 500: backoff used and headers increment on retries', async () => {
    makeReqSpy
      .mockReturnValueOnce(
        createError({ status: 500, statusText: 'Internal Server Error' })
      )
      .mockReturnValueOnce(
        createError({ status: 500, statusText: 'Internal Server Error' })
      )
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const start = Date.now()
    const updated = await segmentPlugin.track(ctx)

    expect(updated.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(3)
    const [first, second, third] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(second.headers['X-Retry-Count']).toBe('1')
    expect(third.headers['X-Retry-Count']).toBe('2')
    // Ensure some delay occurred between first and last attempt
    expect(Date.now()).toBeGreaterThan(start)
  })

  it('T03 Non-retryable 5xx: 501', async () => {
    makeReqSpy.mockReturnValue(
      createError({ status: 501, statusText: 'Not Implemented' })
    )

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(makeReqSpy).toHaveBeenCalledTimes(1)
    const [req] = getAllRequests()
    expect(req.headers['X-Retry-Count']).toBe('0')
    expect(updated.failedDelivery()).toBeTruthy()
    const err = updated.failedDelivery()!.reason as Error
    expect(err.message).toContain('[501]')
  })

  it('T04 Non-retryable 5xx: 505', async () => {
    makeReqSpy.mockReturnValue(
      createError({ status: 505, statusText: 'HTTP Version Not Supported' })
    )

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(makeReqSpy).toHaveBeenCalledTimes(1)
    const [req] = getAllRequests()
    expect(req.headers['X-Retry-Count']).toBe('0')
    expect(updated.failedDelivery()).toBeTruthy()
    const err = updated.failedDelivery()!.reason as Error
    expect(err.message).toContain('[505]')
  })

  it('T05 Non-retryable 5xx: 511 (no auth)', async () => {
    makeReqSpy.mockReturnValue(
      createError({
        status: 511,
        statusText: 'Network Authentication Required',
      })
    )

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 2,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    // Without a token manager, 511 is non-retryable (like 501/505).
    // Only one attempt should be made.
    expect(makeReqSpy).toHaveBeenCalledTimes(1)
    const [first] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(updated.failedDelivery()).toBeTruthy()
    const err = updated.failedDelivery()!.reason as Error
    expect(err.message).toContain('[511]')
  })

  it('T05b 5xx: 511 with token manager retries and clears token', async () => {
    makeReqSpy
      .mockReturnValueOnce(
        createError({
          status: 511,
          statusText: 'Network Authentication Required',
        })
      )
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin, publisher } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const mockTokenManager = {
      clearToken: jest.fn(),
      getAccessToken: jest.fn().mockResolvedValue({ access_token: 'token' }),
      stopPoller: jest.fn(),
    }

    ;(publisher as any)._tokenManager = mockTokenManager

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(updated.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(2)
    const [first, second] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(second.headers['X-Retry-Count']).toBe('1')
    expect(mockTokenManager.clearToken).toHaveBeenCalledTimes(1)
  })

  it('T06 429 with Retry-After: waits and retries without consuming retry budget', async () => {
    jest.useRealTimers()
    const headers = new TestHeaders()
    headers.set('Retry-After', '1')

    makeReqSpy
      .mockReturnValueOnce(
        createError({
          status: 429,
          statusText: 'Too Many Requests',
          ...headers,
        })
      )
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(updated.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(2)
    const [first, second] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(second.headers['X-Retry-Count']).toBe('2')
  })

  it('T07 408 uses backoff (Retry-After header ignored)', async () => {
    const headers = new TestHeaders()
    headers.set('Retry-After', '1')

    makeReqSpy
      .mockReturnValueOnce(
        createError({
          status: 408,
          statusText: 'Request Timeout',
          ...headers,
        })
      )
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(updated.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(2)
    const [first, second] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(second.headers['X-Retry-Count']).toBe('1')
  })

  it('T08 503 uses backoff (Retry-After header ignored)', async () => {
    const headers = new TestHeaders()
    headers.set('Retry-After', '1')

    makeReqSpy
      .mockReturnValueOnce(
        createError({
          status: 503,
          statusText: 'Service Unavailable',
          ...headers,
        })
      )
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(updated.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(2)
    const [first, second] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(second.headers['X-Retry-Count']).toBe('1')
  })

  it('T09 429 without Retry-After: backoff retry', async () => {
    makeReqSpy
      .mockReturnValueOnce(
        createError({ status: 429, statusText: 'Too Many Requests' })
      )
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const start = Date.now()
    const updated = await segmentPlugin.track(ctx)
    const end = Date.now()

    expect(updated.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(2)
    const [first, second] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(second.headers['X-Retry-Count']).toBe('1')
    expect(end).toBeGreaterThan(start)
  })

  it('T10 Retryable 4xx: 408 without Retry-After', async () => {
    makeReqSpy
      .mockReturnValueOnce(
        createError({ status: 408, statusText: 'Request Timeout' })
      )
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const start = Date.now()
    const updated = await segmentPlugin.track(ctx)
    const end = Date.now()

    expect(updated.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(2)
    const [first, second] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(second.headers['X-Retry-Count']).toBe('1')
    expect(end).toBeGreaterThan(start)
  })

  it('T11 Retryable 4xx: 410', async () => {
    makeReqSpy
      .mockReturnValueOnce(createError({ status: 410, statusText: 'Gone' }))
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(updated.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(2)
    const [first, second] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(second.headers['X-Retry-Count']).toBe('1')
  })

  it('T12 4xx 413 follows general 4xx non-retry rule', async () => {
    makeReqSpy.mockReturnValue(
      createError({ status: 413, statusText: 'Payload Too Large' })
    )

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(makeReqSpy).toHaveBeenCalledTimes(1)
    const [first] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(updated.failedDelivery()).toBeTruthy()
    const err = updated.failedDelivery()!.reason as Error
    expect(err.message).toContain('[413]')
  })

  it('T13 Retryable 4xx: 460', async () => {
    makeReqSpy
      .mockReturnValueOnce(
        createError({ status: 460, statusText: 'Custom Retryable' })
      )
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(updated.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(2)
    const [first, second] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(second.headers['X-Retry-Count']).toBe('1')
  })

  it('T14 Non-retryable 4xx: 404', async () => {
    makeReqSpy.mockReturnValue(
      createError({ status: 404, statusText: 'Not Found' })
    )

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(makeReqSpy).toHaveBeenCalledTimes(1)
    const [first] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(updated.failedDelivery()).toBeTruthy()
    const err = updated.failedDelivery()!.reason as Error
    expect(err.message).toContain('[404]')
  })

  it('T15 Network error (IO): retried with backoff', async () => {
    makeReqSpy
      .mockRejectedValueOnce(new Error('Connection Error'))
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const start = Date.now()
    const updated = await segmentPlugin.track(ctx)
    const end = Date.now()

    expect(updated.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(2)
    const [first, second] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(second.headers['X-Retry-Count']).toBe('1')
    expect(end).toBeGreaterThan(start)
  })

  it('T16 Max retries exhausted (backoff)', async () => {
    makeReqSpy.mockReturnValue(
      createError({ status: 500, statusText: 'Internal Server Error' })
    )

    const maxRetries = 2
    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    // M+1 total attempts
    expect(makeReqSpy).toHaveBeenCalledTimes(maxRetries + 1)
    const [first, second, third] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(second.headers['X-Retry-Count']).toBe('1')
    expect(third.headers['X-Retry-Count']).toBe('2')
    expect(updated.failedDelivery()).toBeTruthy()
  })

  it('T17 429 with Retry-After retries with same retry count (does not consume retry budget)', async () => {
    jest.useRealTimers()
    const headers = new TestHeaders()
    headers.set('Retry-After', '1')

    makeReqSpy
      .mockReturnValueOnce(
        createError({
          status: 429,
          statusText: 'Too Many Requests',
          ...headers,
        })
      )
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 1,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(makeReqSpy).toHaveBeenCalledTimes(2)
    const [first, second] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(second.headers['X-Retry-Count']).toBe('2')
    expect(updated.failedDelivery()).toBeFalsy()
  })

  it('T18 X-Retry-Count semantics across mixed retries', async () => {
    makeReqSpy
      .mockReturnValueOnce(
        createError({ status: 408, statusText: 'Request Timeout' })
      )
      .mockReturnValueOnce(
        createError({ status: 500, statusText: 'Internal Server Error' })
      )
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(updated.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(3)
    const [first, second, third] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(second.headers['X-Retry-Count']).toBe('1')
    expect(third.headers['X-Retry-Count']).toBe('2')
  })

  it('T19 Non-retryable 4xx: 400', async () => {
    makeReqSpy.mockReturnValue(
      createError({ status: 400, statusText: 'Bad Request' })
    )

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(makeReqSpy).toHaveBeenCalledTimes(1)
    const [first] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(updated.failedDelivery()).toBeTruthy()
    const err = updated.failedDelivery()!.reason as Error
    expect(err.message).toContain('[400]')
  })

  it('T19 Non-retryable 4xx: 401', async () => {
    makeReqSpy.mockReturnValue(
      createError({ status: 401, statusText: 'Unauthorized' })
    )

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(makeReqSpy).toHaveBeenCalledTimes(1)
    const [first] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(updated.failedDelivery()).toBeTruthy()
    const err = updated.failedDelivery()!.reason as Error
    expect(err.message).toContain('[401]')
  })

  it('T19 Non-retryable 4xx: 403', async () => {
    makeReqSpy.mockReturnValue(
      createError({ status: 403, statusText: 'Forbidden' })
    )

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(makeReqSpy).toHaveBeenCalledTimes(1)
    const [first] = getAllRequests()
    expect(first.headers['X-Retry-Count']).toBe('0')
    expect(updated.failedDelivery()).toBeTruthy()
    const err = updated.failedDelivery()!.reason as Error
    expect(err.message).toContain('[403]')
  })

  it('T20 Authorization header uses Basic auth when no OAuth', async () => {
    makeReqSpy.mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      writeKey: 'test-write-key',
      flushAt: 1,
    })

    const ctx = trackEvent()
    await segmentPlugin.track(ctx)

    expect(makeReqSpy).toHaveBeenCalledTimes(1)
    const [first] = getAllRequests()
    expect(first.headers['Authorization']).toMatch(/^Basic /)
  })

  it('T21 Safety cap: persistent 429 with Retry-After eventually fails', async () => {
    jest.useRealTimers()
    const headers = new TestHeaders()
    headers.set('Retry-After', '0')

    makeReqSpy.mockReturnValue(
      createError({
        status: 429,
        statusText: 'Too Many Requests',
        ...headers,
      })
    )

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 0,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const updated = await segmentPlugin.track(ctx)

    expect(makeReqSpy.mock.calls.length).toBeGreaterThan(1)
    expect(updated.failedDelivery()).toBeTruthy()
  })

  it('T22 Retry-After capped at 300 seconds (unit test)', async () => {
    // The Retry-After cap is enforced in getRetryAfterInSeconds via
    // Math.min(seconds, MAX_RETRY_AFTER_SECONDS).
    jest.useFakeTimers()
    const headers = new TestHeaders()
    headers.set('Retry-After', '600') // exceeds 300s cap

    makeReqSpy
      .mockReturnValueOnce(
        createError({
          status: 429,
          statusText: 'Too Many Requests',
          ...headers,
        })
      )
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 1,
      flushAt: 1,
    })

    const ctx = trackEvent()
    const pending = segmentPlugin.track(ctx)

    expect(makeReqSpy).toHaveBeenCalledTimes(1)

    // Capped from 600s to 300s before retrying.
    await jest.advanceTimersByTimeAsync(300000)
    const updated = await pending

    expect(makeReqSpy).toHaveBeenCalledTimes(2)
    expect(updated.failedDelivery()).toBeFalsy()
  })

  it('T04 429 halts current upload iteration (no further batches attempted)', async () => {
    jest.useFakeTimers()
    const headers = new TestHeaders()
    headers.set('Retry-After', '60')

    // First batch gets 429, then succeeds after the Retry-After delay.
    makeReqSpy
      .mockReturnValueOnce(
        createError({
          status: 429,
          statusText: 'Too Many Requests',
          ...headers,
        })
      )
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
    })

    // Send first event — it gets 429 and enters rate-limited wait.
    const ctx1 = trackEvent()
    const pending1 = segmentPlugin.track(ctx1)
    await Promise.resolve()
    expect(makeReqSpy).toHaveBeenCalledTimes(1)

    // Send second event — should be blocked by active rate-limit and not request yet.
    const ctx2 = trackEvent()
    const pending2 = segmentPlugin.track(ctx2)
    await Promise.resolve()
    expect(makeReqSpy).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(60000)

    const [updated1, updated2] = await Promise.all([pending1, pending2])
    expect(updated1.failedDelivery()).toBeFalsy()
    expect(updated2.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(3)
  })

  it('T19 maxTotalBackoffDuration: drops batch after duration exceeded', async () => {
    jest.useRealTimers()

    // Always return 500 to keep retrying
    makeReqSpy.mockReturnValue(
      createError({ status: 500, statusText: 'Internal Server Error' })
    )

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 100, // high retry count so duration limit kicks in first
      flushAt: 1,
      // Set a very short maxTotalBackoffDuration so the test completes quickly
      maxTotalBackoffDuration: 1, // 1 second
    })

    const ctx = trackEvent()
    const start = Date.now()
    const updated = await segmentPlugin.track(ctx)
    const elapsed = Date.now() - start

    // Batch should have been dropped due to maxTotalBackoffDuration
    expect(updated.failedDelivery()).toBeTruthy()
    const err = updated.failedDelivery()!.reason as Error
    expect(err.message).toContain('[500]')
    // Should have taken at least ~1 second (the duration limit)
    expect(elapsed).toBeGreaterThanOrEqual(900)
    // But should not have exhausted all 100 retries
    expect(makeReqSpy.mock.calls.length).toBeLessThan(100)
  })

  it('T20 maxRateLimitDuration: clears rate-limit window and resumes send', async () => {
    jest.useFakeTimers()
    const headers = new TestHeaders()
    headers.set('Retry-After', '60')

    makeReqSpy
      .mockReturnValueOnce(
        createError({
          status: 429,
          statusText: 'Too Many Requests',
          ...headers,
        })
      )
      .mockReturnValue(createSuccess())

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      flushAt: 1,
      maxRateLimitDuration: 1, // 1 second
    })

    // First event gets 429, then resumes after maxRateLimitDuration elapses.
    const ctx1 = trackEvent()
    const pending = segmentPlugin.track(ctx1)
    expect(makeReqSpy).toHaveBeenCalledTimes(1)

    await jest.advanceTimersByTimeAsync(1000)
    const updated1 = await pending
    expect(updated1.failedDelivery()).toBeFalsy()
    expect(makeReqSpy).toHaveBeenCalledTimes(2)
  })
})
