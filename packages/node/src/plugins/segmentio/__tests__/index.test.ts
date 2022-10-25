const fetcher = jest.fn()
jest.mock('node-fetch', () => fetcher)

import { CoreContext, EventFactory } from '@segment/analytics-core'
import {
  createError,
  createSuccess,
} from '../../../__tests__/test-helpers/factories'
import { configureNodePlugin } from '../index'

const bodyPropertyMatchers = {
  messageId: expect.stringMatching(/^ajs-next-[\w\d]+$/),
  timestamp: expect.stringMatching(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  ),
  _metadata: {
    nodeVersion: expect.any(String),
  },
  context: {
    library: {
      name: 'AnalyticsNode',
      version: expect.any(String),
    },
  },
  integrations: {},
}

function validateFetcherInputs(...contexts: CoreContext[]) {
  const [url, request] = fetcher.mock.lastCall
  const body = JSON.parse(request.body)

  expect(url).toBe('https://api.segment.io/v1/batch')
  expect(request.method).toBe('POST')
  expect(request.headers).toMatchInlineSnapshot(`
    Object {
      "Authorization": "Basic Og==",
      "Content-Type": "application/json",
      "User-Agent": "analytics-node-next/latest",
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

describe('SegmentNodePlugin', () => {
  const eventFactory = new EventFactory()

  beforeEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runAllTimers()
    jest.useRealTimers()
  })

  describe('methods', () => {
    it('alias', async () => {
      const segmentPlugin = configureNodePlugin({
        maxAttempts: 4,
        maxEventsInBatch: 1,
        maxWaitTimeInMs: 1000,
        writeKey: '',
      })

      const event = eventFactory.alias('to', 'from')
      const context = new CoreContext(event)

      fetcher.mockReturnValueOnce(createSuccess())
      await segmentPlugin.alias(context)

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
      const segmentPlugin = configureNodePlugin({
        maxAttempts: 4,
        maxEventsInBatch: 1,
        maxWaitTimeInMs: 1000,
        writeKey: '',
      })

      const event = eventFactory.group(
        'foo-group-id',
        {
          name: 'libraries',
        },
        { userId: 'foo-user-id' }
      )
      const context = new CoreContext(event)

      fetcher.mockReturnValueOnce(createSuccess())
      await segmentPlugin.group(context)

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
      const segmentPlugin = configureNodePlugin({
        maxAttempts: 4,
        maxEventsInBatch: 1,
        maxWaitTimeInMs: 1000,
        writeKey: '',
      })

      const event = eventFactory.identify('foo-user-id', {
        name: 'Chris Radek',
      })
      const context = new CoreContext(event)

      fetcher.mockReturnValueOnce(createSuccess())
      await segmentPlugin.identify(context)

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
      const segmentPlugin = configureNodePlugin({
        maxAttempts: 4,
        maxEventsInBatch: 1,
        maxWaitTimeInMs: 1000,
        writeKey: '',
      })

      const event = eventFactory.page(
        'Category',
        'Home',
        { url: 'http://localhost' },
        { userId: 'foo-user-id' }
      )
      const context = new CoreContext(event)

      fetcher.mockReturnValueOnce(createSuccess())
      await segmentPlugin.page(context)

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
      const segmentPlugin = configureNodePlugin({
        maxAttempts: 4,
        maxEventsInBatch: 1,
        maxWaitTimeInMs: 1000,
        writeKey: '',
      })

      const event = eventFactory.screen(
        'Category',
        'Home',
        { variation: 'local' },
        { userId: 'foo-user-id' }
      )
      const context = new CoreContext(event)

      fetcher.mockReturnValueOnce(createSuccess())
      await segmentPlugin.screen(context)

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
      const segmentPlugin = configureNodePlugin({
        maxAttempts: 4,
        maxEventsInBatch: 1,
        maxWaitTimeInMs: 1000,
        writeKey: '',
      })

      const event = eventFactory.track(
        'test event',
        { foo: 'bar' },
        { userId: 'foo-user-id' }
      )
      const context = new CoreContext(event)

      fetcher.mockReturnValueOnce(createSuccess())
      await segmentPlugin.screen(context)

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
      fetcher.mockReturnValue(createSuccess())

      const segmentPlugin = configureNodePlugin({
        maxAttempts: 4,
        maxEventsInBatch: 3,
        maxWaitTimeInMs: 1000,
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
      ].map((event) => new CoreContext(event))

      for (const context of contexts) {
        // We want batching to happen, so don't await.
        void segmentPlugin[context.event.type](context)
      }

      // Expect a single fetch call for all 3 events.
      expect(fetcher).toHaveBeenCalledTimes(1)

      validateFetcherInputs(...contexts)
    })

    it('supports waiting a max amount of time before sending', async () => {
      fetcher.mockReturnValue(createSuccess())

      const segmentPlugin = configureNodePlugin({
        maxAttempts: 4,
        maxEventsInBatch: 3,
        maxWaitTimeInMs: 1000,
        writeKey: '',
      })

      const context = new CoreContext(eventFactory.alias('to', 'from'))

      const pendingContext = segmentPlugin.alias(context)

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
      fetcher.mockReturnValue(createSuccess())

      const segmentPlugin = configureNodePlugin({
        maxAttempts: 4,
        maxEventsInBatch: 2,
        maxWaitTimeInMs: 1000,
        writeKey: '',
      })

      const context = new CoreContext(eventFactory.alias('to', 'from'))

      const contexts: CoreContext[] = []
      // Fill up 1 batch and partially fill another
      for (let i = 0; i < 3; i++) {
        contexts.push(new CoreContext(eventFactory.alias('to', 'from')))
      }

      const pendingContexts = contexts.map((ctx) => segmentPlugin.alias(ctx))

      // Should have seen 1 call due to 1 batch being filled.
      expect(fetcher).toHaveBeenCalledTimes(1)
      validateFetcherInputs(context, context)

      // 2nd batch is not full, so need to wait for the maxWaitTimeInMs to be reached before sending.
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
      fetcher.mockReturnValue(createSuccess())
      const segmentPlugin = configureNodePlugin({
        maxAttempts: 4,
        maxEventsInBatch: 20,
        maxWaitTimeInMs: 100,
        writeKey: '',
      })

      const contexts: CoreContext[] = []
      // Max batch size is ~480KB, so adding 16 events with 30KB buffers will hit the limit.
      for (let i = 0; i < 16; i++) {
        contexts.push(
          new CoreContext(
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
      expect(fetcher).toHaveBeenCalledTimes(1)
      jest.advanceTimersByTime(100)
      expect(fetcher).toHaveBeenCalledTimes(2)

      const updatedContexts = await Promise.all(pendingContexts)
      for (let i = 0; i < 16; i++) {
        expect(updatedContexts[i]).toBe(contexts[i])
        expect(updatedContexts[i].failedDelivery()).toBeFalsy()
      }
    })
  })

  describe('error handling', () => {
    it('excludes events that are too large', async () => {
      const segmentPlugin = configureNodePlugin({
        maxAttempts: 4,
        maxEventsInBatch: 1,
        maxWaitTimeInMs: 1000,
        writeKey: '',
      })

      const context = new CoreContext(
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
          "reason": [Error: Event exceeds maximum event size of 32 kb],
        }
      `)
      expect(fetcher).not.toHaveBeenCalled()
    })

    it('does not retry 400 errors', async () => {
      fetcher.mockReturnValue(
        createError({ status: 400, statusText: 'Bad Request' })
      )

      const segmentPlugin = configureNodePlugin({
        maxAttempts: 4,
        maxEventsInBatch: 1,
        maxWaitTimeInMs: 1000,
        writeKey: '',
      })

      const context = new CoreContext(eventFactory.alias('to', 'from'))

      const updatedContext = await segmentPlugin.alias(context)

      expect(fetcher).toHaveBeenCalledTimes(1)
      validateFetcherInputs(context)

      expect(updatedContext).toBe(context)
      expect(updatedContext.failedDelivery()).toBeTruthy()
      expect(updatedContext.failedDelivery()).toMatchInlineSnapshot(`
        Object {
          "reason": "[400] Bad Request",
        }
      `)
    })

    it('retries non-400 errors', async () => {
      // Jest kept timing out when using fake timers despite advancing time.
      jest.useRealTimers()

      fetcher.mockReturnValue(
        createError({ status: 500, statusText: 'Internal Server Error' })
      )

      const segmentPlugin = configureNodePlugin({
        maxAttempts: 3,
        maxEventsInBatch: 1,
        maxWaitTimeInMs: 1000,
        writeKey: '',
      })

      const context = new CoreContext(eventFactory.alias('to', 'from'))

      const pendingContext = segmentPlugin.alias(context)
      const updatedContext = await pendingContext

      expect(fetcher).toHaveBeenCalledTimes(3)
      validateFetcherInputs(context)

      expect(updatedContext).toBe(context)
      expect(updatedContext.failedDelivery()).toBeTruthy()
      expect(updatedContext.failedDelivery()).toMatchInlineSnapshot(`
        Object {
          "reason": "[500] Internal Server Error",
        }
      `)
    })

    it('retries fetch errors', async () => {
      // Jest kept timing out when using fake timers despite advancing time.
      jest.useRealTimers()

      fetcher.mockRejectedValue(new Error('Connection Error'))

      const segmentPlugin = configureNodePlugin({
        maxAttempts: 3,
        maxEventsInBatch: 1,
        maxWaitTimeInMs: 1000,
        writeKey: '',
      })

      const context = new CoreContext(eventFactory.alias('my', 'from'))

      const pendingContext = segmentPlugin.alias(context)
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
})
