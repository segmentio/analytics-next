import { Emitter } from '@segment/analytics-core'
import { range } from 'lodash'
import { createConfiguredNodePlugin } from '..'
import { Context } from '../../../app/context'
import { NodeEventFactory } from '../../../app/event-factory'
import { assertHttpRequestEmittedEvent } from '../../../__tests__/test-helpers/assert-shape'
import {
  createError,
  TestFetchClient,
} from '../../../__tests__/test-helpers/factories'
import { PublisherProps } from '../publisher'
import { assertSegmentApiBody } from './test-helpers/segment-http-api'

let emitter: Emitter
const createTestNodePlugin = (props: PublisherProps) =>
  createConfiguredNodePlugin(props, emitter)

const testClient = new TestFetchClient()

const validateInputs = (...contexts: Context[]) => {
  const [url, request] = testClient.lastCall
  return assertSegmentApiBody(url, request, contexts)
}

const eventFactory = new NodeEventFactory()

beforeEach(() => {
  emitter = new Emitter()
  testClient.reset()
  jest.useFakeTimers()
})

it('supports multiple events in a batch', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin({
    maxRetries: 3,
    maxEventsInBatch: 3,
    flushInterval: 1000,
    writeKey: '',
    httpClient: testClient,
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
  expect(testClient.callCount == 1)

  validateInputs(...contexts)
})

it('supports waiting a max amount of time before sending', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin({
    maxRetries: 3,
    maxEventsInBatch: 3,
    flushInterval: 1000,
    writeKey: '',
    httpClient: testClient,
  })

  const context = new Context(eventFactory.alias('to', 'from'))

  const pendingContext = segmentPlugin.alias(context)

  jest.advanceTimersByTime(500)

  expect(testClient.callCount == 0)

  jest.advanceTimersByTime(500)

  // Expect a single fetch call for all 1 events.
  expect(testClient.callCount == 1)
  validateInputs(context)

  // Make sure we're returning the context in the resolved promise.
  const updatedContext = await pendingContext
  expect(updatedContext).toBe(context)
  expect(updatedContext.failedDelivery()).toBeFalsy()
})

it('sends as soon as batch fills up or max time is reached', async () => {
  const { plugin: segmentPlugin } = createTestNodePlugin({
    maxRetries: 3,
    maxEventsInBatch: 2,
    flushInterval: 1000,
    writeKey: '',
    httpClient: testClient,
  })

  const context = new Context(eventFactory.alias('to', 'from'))

  const contexts: Context[] = []
  // Fill up 1 batch and partially fill another
  for (let i = 0; i < 3; i++) {
    contexts.push(new Context(eventFactory.alias('to', 'from')))
  }

  const pendingContexts = contexts.map((ctx) => segmentPlugin.alias(ctx))

  // Should have seen 1 call due to 1 batch being filled.
  expect(testClient.callCount == 1)
  validateInputs(context, context)

  // 2nd batch is not full, so need to wait for the flushInterval to be reached before sending.
  jest.advanceTimersByTime(500)
  expect(testClient.callCount == 1)
  jest.advanceTimersByTime(500)
  expect(testClient.callCount == 2)

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
    maxEventsInBatch: 20,
    flushInterval: 100,
    writeKey: '',
    httpClient: testClient,
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
  expect(testClient.callCount == 1)
  jest.advanceTimersByTime(100)
  expect(testClient.callCount == 2)

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
      maxRetries: 3,
      maxEventsInBatch: 20,
      flushInterval: 1000,
      writeKey: '',
      httpClient: testClient,
    })

    publisher.flushAfterClose(3)

    void segmentPlugin.track(_createTrackCtx())
    void segmentPlugin.track(_createTrackCtx())
    expect(testClient.callCount == 0)
    void segmentPlugin.track(_createTrackCtx())
    expect(testClient.callCount == 1)
  })

  it('continues to flush on each event if batch size is 1', async () => {
    const { plugin: segmentPlugin, publisher } = createTestNodePlugin({
      maxRetries: 3,
      maxEventsInBatch: 1,
      flushInterval: 1000,
      writeKey: '',
      httpClient: testClient,
    })

    publisher.flushAfterClose(3)

    void segmentPlugin.track(_createTrackCtx())
    void segmentPlugin.track(_createTrackCtx())
    void segmentPlugin.track(_createTrackCtx())
    expect(testClient.callCount == 3)
  })

  it('sends immediately once there are no pending items, even if pending events exceeds batch size', async () => {
    const { plugin: segmentPlugin, publisher } = createTestNodePlugin({
      maxRetries: 3,
      maxEventsInBatch: 3,
      flushInterval: 1000,
      writeKey: '',
      httpClient: testClient,
    })

    publisher.flushAfterClose(5)
    range(3).forEach(() => segmentPlugin.track(_createTrackCtx()))
    expect(testClient.callCount == 1)
    range(2).forEach(() => segmentPlugin.track(_createTrackCtx()))
    expect(testClient.callCount == 2)
  })

  it('works if there are previous items in the batch', async () => {
    const { plugin: segmentPlugin, publisher } = createTestNodePlugin({
      maxRetries: 3,
      maxEventsInBatch: 7,
      flushInterval: 1000,
      writeKey: '',
      httpClient: testClient,
    })

    range(3).forEach(() => segmentPlugin.track(_createTrackCtx())) // should not flush
    expect(testClient.callCount == 0)
    publisher.flushAfterClose(5)
    expect(testClient.callCount == 0)
    range(2).forEach(() => segmentPlugin.track(_createTrackCtx()))
    expect(testClient.callCount == 1)
  })

  it('works if there are previous items in the batch AND pending items > batch size', async () => {
    const { plugin: segmentPlugin, publisher } = createTestNodePlugin({
      maxRetries: 3,
      maxEventsInBatch: 7,
      flushInterval: 1000,
      writeKey: '',
      httpClient: testClient,
    })

    range(3).forEach(() => segmentPlugin.track(_createTrackCtx())) // should not flush
    expect(testClient.callCount == 0)
    publisher.flushAfterClose(10)
    expect(testClient.callCount == 0)
    range(4).forEach(() => segmentPlugin.track(_createTrackCtx())) // batch is full, send.
    expect(testClient.callCount == 1)
    range(2).forEach(() => segmentPlugin.track(_createTrackCtx()))
    expect(testClient.callCount == 1)
    void segmentPlugin.track(_createTrackCtx()) // pending items limit has been reached, send.
    expect(testClient.callCount == 2)
  })
})

describe('error handling', () => {
  it('excludes events that are too large', async () => {
    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      maxEventsInBatch: 1,
      flushInterval: 1000,
      writeKey: '',
      httpClient: testClient,
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
      Object {
        "reason": [Error: Event exceeds maximum event size of 32 KB],
      }
    `)
    expect(testClient.callCount == 0)
  })

  it('does not retry 400 errors', async () => {
    testClient.returnValue = createError({
      status: 400,
      statusText: 'Bad Request',
    })

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      maxEventsInBatch: 1,
      flushInterval: 1000,
      writeKey: '',
      httpClient: testClient,
    })

    const context = new Context(eventFactory.alias('to', 'from'))

    const updatedContext = await segmentPlugin.alias(context)

    expect(testClient.callCount == 1)
    validateInputs(context)

    expect(updatedContext).toBe(context)
    expect(updatedContext.failedDelivery()).toBeTruthy()
    expect(updatedContext.failedDelivery()).toMatchInlineSnapshot(`
      Object {
        "reason": [Error: [400] Bad Request],
      }
    `)
  })

  it('retries non-400 errors', async () => {
    // Jest kept timing out when using fake timers despite advancing time.
    jest.useRealTimers()

    testClient.returnValue = createError({
      status: 500,
      statusText: 'Internal Server Error',
    })

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 2,
      maxEventsInBatch: 1,
      flushInterval: 1000,
      writeKey: '',
      httpClient: testClient,
    })

    const context = new Context(eventFactory.alias('to', 'from'))

    const pendingContext = segmentPlugin.alias(context)
    const updatedContext = await pendingContext

    expect(testClient.callCount == 3)
    validateInputs(context)

    expect(updatedContext).toBe(context)
    expect(updatedContext.failedDelivery()).toBeTruthy()
    expect(updatedContext.failedDelivery()).toMatchInlineSnapshot(`
      Object {
        "reason": [Error: [500] Internal Server Error],
      }
    `)
  })

  it('retries fetch errors', async () => {
    // Jest kept timing out when using fake timers despite advancing time.
    jest.useRealTimers()

    testClient.errorValue = new Error('Connection Error')

    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 2,
      maxEventsInBatch: 1,
      flushInterval: 1000,
      writeKey: '',
      httpClient: testClient,
    })

    const context = new Context(eventFactory.alias('my', 'from'))

    const pendingContext = segmentPlugin.alias(context)
    const updatedContext = await pendingContext

    expect(testClient.callCount == 3)
    validateInputs(context)

    expect(updatedContext).toBe(context)
    expect(updatedContext.failedDelivery()).toBeTruthy()
    expect(updatedContext.failedDelivery()).toMatchInlineSnapshot(`
      Object {
        "reason": [Error: Connection Error],
      }
    `)
  })

  it('should fetch only once if maxRetries is 0', async () => {
    // Jest kept timing out when using fake timers despite advancing time.
    jest.useRealTimers()

    testClient.errorValue = new Error('Connection Error')
    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 0,
      maxEventsInBatch: 1,
      flushInterval: 1000,
      writeKey: '',
      httpClient: testClient,
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
    expect(testClient.callCount == 1)
  })
})

describe('http_request emitter event', () => {
  it('should emit an http_request object', async () => {
    const { plugin: segmentPlugin } = createTestNodePlugin({
      maxRetries: 3,
      maxEventsInBatch: 1,
      flushInterval: 1000,
      writeKey: '',
      httpClient: testClient,
    })

    const fn = jest.fn()
    emitter.on('http_request', fn)
    const context = new Context(
      eventFactory.track('foo', undefined, { userId: 'foo-user-id' })
    )
    await segmentPlugin.track(context)
    assertHttpRequestEmittedEvent(fn.mock.lastCall[0])
  })
})
