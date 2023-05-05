const fetcher = jest.fn()
jest.mock('../../../lib/fetch', () => ({ fetch: fetcher }))
import { range } from 'lodash'
import { NodeEventFactory } from '../../../app/event-factory'
import {
  createError,
  createSuccess,
} from '../../../__tests__/test-helpers/factories'
import { createConfiguredNodePlugin } from '../index'
import { PublisherProps } from '../publisher'
import { Context } from '../../../app/context'
import { Emitter } from '@customerio/cdp-analytics-core'
import { assertHttpRequestEmittedEvent } from '../../../__tests__/test-helpers/assert-shape'

let emitter: Emitter
const createTestNodePlugin = (props: PublisherProps) =>
  createConfiguredNodePlugin(props, emitter)

const bodyPropertyMatchers = {
  messageId: expect.stringMatching(/^node-next-\d*-\w*-\w*-\w*-\w*-\w*/),
  timestamp: expect.stringMatching(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  ),
  _metadata: expect.any(Object),
  context: {
    library: {
      name: '@customerio/cdp-analytics-node',
      version: expect.any(String),
    },
  },
  integrations: {},
}

function validateFetcherInputs(...contexts: Context[]) {
  const [url, request] = fetcher.mock.lastCall
  const body = JSON.parse(request.body)

  expect(url).toBe('https://cdp.customer.io/v1/batch')
  expect(request.method).toBe('POST')
  expect(request.headers).toMatchInlineSnapshot(`
    Object {
      "Authorization": "Basic Og==",
      "Content-Type": "application/json",
      "User-Agent": "cdp-analytics-node/latest",
    }
  `)

  expect(body.batch).toHaveLength(contexts.length)
  for (let i = 0; i < contexts.length; i++) {
    expect(body.batch[i]).toEqual({
      ...contexts[i].event,
      ...bodyPropertyMatchers,
    })
  }
}

describe('CustomerioNodePlugin', () => {
  const eventFactory = new NodeEventFactory()

  beforeEach(() => {
    emitter = new Emitter()
    fetcher.mockReturnValue(createSuccess())
    jest.useFakeTimers()
  })

  describe('methods', () => {
    it('alias', async () => {
      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 3,
        maxEventsInBatch: 1,
        flushInterval: 1000,
        writeKey: '',
      })

      const event = eventFactory.alias('to', 'from')
      const context = new Context(event)

      fetcher.mockReturnValueOnce(createSuccess())
      await customerioPlugin.alias(context)

      expect(fetcher).toHaveBeenCalledTimes(1)
      validateFetcherInputs(context)

      const [, request] = fetcher.mock.lastCall
      const body = JSON.parse(request.body)

      expect(body.batch).toHaveLength(1)
      expect(body.batch[0]).toEqual({
        ...bodyPropertyMatchers,
        type: 'alias',
        previousId: 'from',
        userId: 'to',
      })
    })

    it('group', async () => {
      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 3,
        maxEventsInBatch: 1,
        flushInterval: 1000,
        writeKey: '',
      })

      const event = eventFactory.group(
        'foo-group-id',
        {
          name: 'libraries',
        },
        { userId: 'foo-user-id' }
      )
      const context = new Context(event)

      fetcher.mockReturnValueOnce(createSuccess())
      await customerioPlugin.group(context)

      expect(fetcher).toHaveBeenCalledTimes(1)
      validateFetcherInputs(context)

      const [, request] = fetcher.mock.lastCall
      const body = JSON.parse(request.body)

      expect(body.batch).toHaveLength(1)
      expect(body.batch[0]).toEqual({
        ...bodyPropertyMatchers,
        traits: {
          name: 'libraries',
        },
        type: 'group',
        groupId: 'foo-group-id',
        userId: 'foo-user-id',
      })
    })

    it('identify', async () => {
      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 3,
        maxEventsInBatch: 1,
        flushInterval: 1000,
        writeKey: '',
      })

      const event = eventFactory.identify('foo-user-id', {
        name: 'Chris Radek',
      })
      const context = new Context(event)

      fetcher.mockReturnValueOnce(createSuccess())
      await customerioPlugin.identify(context)

      expect(fetcher).toHaveBeenCalledTimes(1)
      validateFetcherInputs(context)

      const [, request] = fetcher.mock.lastCall
      const body = JSON.parse(request.body)
      expect(body.batch).toHaveLength(1)
      expect(body.batch[0]).toEqual({
        ...bodyPropertyMatchers,
        traits: {
          name: 'Chris Radek',
        },
        type: 'identify',
        userId: 'foo-user-id',
      })
    })

    it('page', async () => {
      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 3,
        maxEventsInBatch: 1,
        flushInterval: 1000,
        writeKey: '',
      })

      const event = eventFactory.page(
        'Category',
        'Home',
        { url: 'http://localhost' },
        { userId: 'foo-user-id' }
      )
      const context = new Context(event)

      fetcher.mockReturnValueOnce(createSuccess())
      await customerioPlugin.page(context)

      expect(fetcher).toHaveBeenCalledTimes(1)
      validateFetcherInputs(context)

      const [, request] = fetcher.mock.lastCall
      const body = JSON.parse(request.body)

      expect(body.batch).toHaveLength(1)
      expect(body.batch[0]).toEqual({
        ...bodyPropertyMatchers,
        type: 'page',
        userId: 'foo-user-id',
        name: 'Home',
        category: 'Category',
        properties: {
          category: 'Category',
          url: 'http://localhost',
        },
      })
    })

    it('screen', async () => {
      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 3,
        maxEventsInBatch: 1,
        flushInterval: 1000,
        writeKey: '',
      })

      const event = eventFactory.screen(
        'Category',
        'Home',
        { variation: 'local' },
        { userId: 'foo-user-id' }
      )
      const context = new Context(event)

      fetcher.mockReturnValueOnce(createSuccess())
      await customerioPlugin.screen(context)

      expect(fetcher).toHaveBeenCalledTimes(1)
      validateFetcherInputs(context)

      const [, request] = fetcher.mock.lastCall
      const body = JSON.parse(request.body)

      expect(body.batch).toHaveLength(1)
      expect(body.batch[0]).toEqual({
        ...bodyPropertyMatchers,
        type: 'screen',
        userId: 'foo-user-id',
        name: 'Home',
        category: 'Category',
        properties: {
          variation: 'local',
        },
      })
    })

    it('track', async () => {
      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 3,
        maxEventsInBatch: 1,
        flushInterval: 1000,
        writeKey: '',
      })

      const event = eventFactory.track(
        'test event',
        { foo: 'bar' },
        { userId: 'foo-user-id' }
      )
      const context = new Context(event)

      fetcher.mockReturnValueOnce(createSuccess())
      await customerioPlugin.screen(context)

      expect(fetcher).toHaveBeenCalledTimes(1)
      validateFetcherInputs(context)

      const [, request] = fetcher.mock.lastCall
      const body = JSON.parse(request.body)

      expect(body.batch).toHaveLength(1)
      expect(body.batch[0]).toEqual({
        ...bodyPropertyMatchers,
        type: 'track',
        event: 'test event',
        userId: 'foo-user-id',
        properties: {
          foo: 'bar',
        },
      })
    })
  })

  describe('batching', () => {
    it('supports multiple events in a batch', async () => {
      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 3,
        maxEventsInBatch: 3,
        flushInterval: 1000,
        writeKey: '',
      })

      // Create 3 events of mixed types to send.
      const contexts = [
        eventFactory.track(
          'test event',
          { foo: 'bar' },
          { userId: 'foo-user-id' }
        ),
        eventFactory.alias('to', 'from'),
        eventFactory.identify('foo-user-id', {
          name: 'Chris Radek',
        }),
      ].map((event) => new Context(event))

      for (const context of contexts) {
        // We want batching to happen, so don't await.
        void customerioPlugin[context.event.type](context)
      }

      // Expect a single fetch call for all 3 events.
      expect(fetcher).toHaveBeenCalledTimes(1)

      validateFetcherInputs(...contexts)
    })

    it('supports waiting a max amount of time before sending', async () => {
      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 3,
        maxEventsInBatch: 3,
        flushInterval: 1000,
        writeKey: '',
      })

      const context = new Context(eventFactory.alias('to', 'from'))

      const pendingContext = customerioPlugin.alias(context)

      jest.advanceTimersByTime(500)

      expect(fetcher).not.toHaveBeenCalled()

      jest.advanceTimersByTime(500)

      // Expect a single fetch call for all 1 events.
      expect(fetcher).toHaveBeenCalledTimes(1)
      validateFetcherInputs(context)

      // Make sure we're returning the context in the resolved promise.
      const updatedContext = await pendingContext
      expect(updatedContext).toBe(context)
      expect(updatedContext.failedDelivery()).toBeFalsy()
    })

    it('sends as soon as batch fills up or max time is reached', async () => {
      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 3,
        maxEventsInBatch: 2,
        flushInterval: 1000,
        writeKey: '',
      })

      const context = new Context(eventFactory.alias('to', 'from'))

      const contexts: Context[] = []
      // Fill up 1 batch and partially fill another
      for (let i = 0; i < 3; i++) {
        contexts.push(new Context(eventFactory.alias('to', 'from')))
      }

      const pendingContexts = contexts.map((ctx) => customerioPlugin.alias(ctx))

      // Should have seen 1 call due to 1 batch being filled.
      expect(fetcher).toHaveBeenCalledTimes(1)
      validateFetcherInputs(context, context)

      // 2nd batch is not full, so need to wait for the flushInterval to be reached before sending.
      jest.advanceTimersByTime(500)
      expect(fetcher).toHaveBeenCalledTimes(1)
      jest.advanceTimersByTime(500)
      expect(fetcher).toHaveBeenCalledTimes(2)

      // Make sure we're returning the context in the resolved promise.
      const updatedContexts = await Promise.all(pendingContexts)
      for (let i = 0; i < 3; i++) {
        expect(updatedContexts[i]).toBe(contexts[i])
        expect(updatedContexts[i].failedDelivery()).toBeFalsy()
      }
    })

    it('sends if batch will exceed max size in bytes when adding event', async () => {
      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 3,
        maxEventsInBatch: 20,
        flushInterval: 100,
        writeKey: '',
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

      const pendingContexts = contexts.map((ctx) => customerioPlugin.track(ctx))
      expect(fetcher).toHaveBeenCalledTimes(1)
      jest.advanceTimersByTime(100)
      expect(fetcher).toHaveBeenCalledTimes(2)

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

      it('sends immediately once all pending events reach the plugin, regardless of settings like batch size', async () => {
        const _createTrackCtx = () =>
          new Context(
            eventFactory.track(
              'test event',
              { foo: 'bar' },
              { userId: 'foo-user-id' }
            )
          )

        const { plugin: customerioPlugin, publisher } = createTestNodePlugin({
          maxRetries: 3,
          maxEventsInBatch: 20,
          flushInterval: 1000,
          writeKey: '',
        })

        publisher.flushAfterClose(3)

        void customerioPlugin.track(_createTrackCtx())
        void customerioPlugin.track(_createTrackCtx())
        expect(fetcher).toHaveBeenCalledTimes(0)
        void customerioPlugin.track(_createTrackCtx())
        expect(fetcher).toBeCalledTimes(1)
      })

      it('continues to flush on each event if batch size is 1', async () => {
        const { plugin: customerioPlugin, publisher } = createTestNodePlugin({
          maxRetries: 3,
          maxEventsInBatch: 1,
          flushInterval: 1000,
          writeKey: '',
        })

        publisher.flushAfterClose(3)

        void customerioPlugin.track(_createTrackCtx())
        void customerioPlugin.track(_createTrackCtx())
        void customerioPlugin.track(_createTrackCtx())
        expect(fetcher).toBeCalledTimes(3)
      })

      it('sends immediately once there are no pending items, even if pending events exceeds batch size', async () => {
        const { plugin: customerioPlugin, publisher } = createTestNodePlugin({
          maxRetries: 3,
          maxEventsInBatch: 3,
          flushInterval: 1000,
          writeKey: '',
        })

        publisher.flushAfterClose(5)
        range(3).forEach(() => customerioPlugin.track(_createTrackCtx()))
        expect(fetcher).toHaveBeenCalledTimes(1)
        range(2).forEach(() => customerioPlugin.track(_createTrackCtx()))
        expect(fetcher).toHaveBeenCalledTimes(2)
      })

      it('works if there are previous items in the batch', async () => {
        const { plugin: customerioPlugin, publisher } = createTestNodePlugin({
          maxRetries: 3,
          maxEventsInBatch: 7,
          flushInterval: 1000,
          writeKey: '',
        })

        range(3).forEach(() => customerioPlugin.track(_createTrackCtx())) // should not flush
        expect(fetcher).toHaveBeenCalledTimes(0)
        publisher.flushAfterClose(5)
        expect(fetcher).toHaveBeenCalledTimes(0)
        range(2).forEach(() => customerioPlugin.track(_createTrackCtx()))
        expect(fetcher).toHaveBeenCalledTimes(1)
      })

      it('works if there are previous items in the batch AND pending items > batch size', async () => {
        const { plugin: customerioPlugin, publisher } = createTestNodePlugin({
          maxRetries: 3,
          maxEventsInBatch: 7,
          flushInterval: 1000,
          writeKey: '',
        })

        range(3).forEach(() => customerioPlugin.track(_createTrackCtx())) // should not flush
        expect(fetcher).toHaveBeenCalledTimes(0)
        publisher.flushAfterClose(10)
        expect(fetcher).toHaveBeenCalledTimes(0)
        range(4).forEach(() => customerioPlugin.track(_createTrackCtx())) // batch is full, send.
        expect(fetcher).toHaveBeenCalledTimes(1)
        range(2).forEach(() => customerioPlugin.track(_createTrackCtx()))
        expect(fetcher).toBeCalledTimes(1)
        void customerioPlugin.track(_createTrackCtx()) // pending items limit has been reached, send.
        expect(fetcher).toBeCalledTimes(2)
      })
    })
  })

  describe('error handling', () => {
    it('excludes events that are too large', async () => {
      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 3,
        maxEventsInBatch: 1,
        flushInterval: 1000,
        writeKey: '',
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
      const updatedContext = await customerioPlugin.track(context)
      expect(updatedContext).toBe(context)
      expect(updatedContext.failedDelivery()).toBeTruthy()
      expect(updatedContext.failedDelivery()).toMatchInlineSnapshot(`
        Object {
          "reason": [Error: Event exceeds maximum event size of 32 KB],
        }
      `)
      expect(fetcher).not.toHaveBeenCalled()
    })

    it('does not retry 400 errors', async () => {
      fetcher.mockReturnValue(
        createError({ status: 400, statusText: 'Bad Request' })
      )

      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 3,
        maxEventsInBatch: 1,
        flushInterval: 1000,
        writeKey: '',
      })

      const context = new Context(eventFactory.alias('to', 'from'))

      const updatedContext = await customerioPlugin.alias(context)

      expect(fetcher).toHaveBeenCalledTimes(1)
      validateFetcherInputs(context)

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

      fetcher.mockReturnValue(
        createError({ status: 500, statusText: 'Internal Server Error' })
      )

      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 2,
        maxEventsInBatch: 1,
        flushInterval: 1000,
        writeKey: '',
      })

      const context = new Context(eventFactory.alias('to', 'from'))

      const pendingContext = customerioPlugin.alias(context)
      const updatedContext = await pendingContext

      expect(fetcher).toHaveBeenCalledTimes(3)
      validateFetcherInputs(context)

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

      fetcher.mockRejectedValue(new Error('Connection Error'))

      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 2,
        maxEventsInBatch: 1,
        flushInterval: 1000,
        writeKey: '',
      })

      const context = new Context(eventFactory.alias('my', 'from'))

      const pendingContext = customerioPlugin.alias(context)
      const updatedContext = await pendingContext

      expect(fetcher).toHaveBeenCalledTimes(3)
      validateFetcherInputs(context)

      expect(updatedContext).toBe(context)
      expect(updatedContext.failedDelivery()).toBeTruthy()
      expect(updatedContext.failedDelivery()).toMatchInlineSnapshot(`
        Object {
          "reason": [Error: Connection Error],
        }
      `)
    })
  })

  describe('http_request emitter event', () => {
    it('should emit an http_request object', async () => {
      const { plugin: customerioPlugin } = createTestNodePlugin({
        maxRetries: 3,
        maxEventsInBatch: 1,
        flushInterval: 1000,
        writeKey: '',
      })

      fetcher.mockReturnValueOnce(createSuccess())
      const fn = jest.fn()
      emitter.on('http_request', fn)
      const context = new Context(
        eventFactory.track('foo', undefined, { userId: 'foo-user-id' })
      )
      await customerioPlugin.track(context)
      assertHttpRequestEmittedEvent(fn.mock.lastCall[0])
    })
  })
})
