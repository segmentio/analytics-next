/* eslint-disable @typescript-eslint/no-floating-promises */
import { noop } from 'lodash'
import { Analytics } from '../../analytics'
import { pWhile } from '../../../lib/p-while'
import * as timer from '../../../lib/priority-queue/backoff'
import {
  MiddlewareFunction,
  sourceMiddlewarePlugin,
} from '../../../plugins/middleware'
import { Context, ContextCancelation } from '../../context'
import { Plugin } from '../../plugin'
import { EventQueue } from '../event-queue'
import { pTimeout } from '../../callback'
import { ActionDestination } from '../../../plugins/remote-loader'
import { UniversalStorage } from '../../user'

const storage = {} as UniversalStorage

async function flushAll(eq: EventQueue): Promise<Context[]> {
  const flushSpy = jest.spyOn(eq, 'flush')
  await pWhile(
    () => eq.queue.length > 0,
    async () => {
      return new Promise((r) => setTimeout(r, 0))
    }
  )
  const results = flushSpy.mock.results.map((r) => r.value)
  flushSpy.mockClear()

  const flushed = await Promise.all(results)
  return flushed.reduce((prev, cur) => {
    return prev.concat(cur)
  }, [])
}

const testPlugin: Plugin = {
  name: 'test',
  type: 'before',
  version: '0.1.0',
  load: () => Promise.resolve(),
  isLoaded: () => true,
}

const ajs = {} as Analytics

let fruitBasket: Context, basketView: Context, shopper: Context

beforeEach(() => {
  fruitBasket = new Context({
    type: 'track',
    event: 'Fruit Basket',
    properties: {
      banana: '🍌',
      apple: '🍎',
      grape: '🍇',
    },
  })

  basketView = new Context({
    type: 'page',
  })

  shopper = new Context({
    type: 'identify',
    traits: {
      name: 'Netto Farah',
    },
  })
})

test('can send events', async () => {
  const eq = new EventQueue()
  const evt = await eq.dispatch(fruitBasket)
  expect(evt).toBe(fruitBasket)
})

test('delivers events out of band', async () => {
  jest.useFakeTimers()

  const eq = new EventQueue()

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  eq.dispatch(fruitBasket)

  expect(jest.getTimerCount()).toBe(1)
  expect(eq.queue.includes(fruitBasket)).toBe(true)

  // run timers and deliver events
  jest.runAllTimers()
  await eq.flush()

  expect(eq.queue.length).toBe(0)
})

test('does not enqueue multiple flushes at once', async () => {
  jest.useFakeTimers()

  const eq = new EventQueue()

  const anothaOne = new Context({
    type: 'page',
  })

  eq.dispatch(fruitBasket)
  eq.dispatch(anothaOne)

  expect(jest.getTimerCount()).toBe(1)
  expect(eq.queue.length).toBe(2)

  // Ensure already enqueued tasks are executed
  jest.runAllTimers()

  // reset the world to use the real timers
  jest.useRealTimers()
  await flushAll(eq)

  expect(eq.queue.length).toBe(0)
})

describe('Flushing', () => {
  beforeEach(() => {
    jest.useRealTimers()
  })

  test('works until the queue is empty', async () => {
    const eq = new EventQueue()

    eq.dispatch(fruitBasket)
    eq.dispatch(basketView)
    eq.dispatch(shopper)

    expect(eq.queue.length).toBe(3)

    const flushed = await flushAll(eq)

    expect(eq.queue.length).toBe(0)
    expect(flushed).toEqual([fruitBasket, basketView, shopper])
  })

  test('re-queues failed events', async () => {
    const eq = new EventQueue()

    await eq.register(
      Context.system(),
      {
        ...testPlugin,
        track: (ctx) => {
          if (ctx === fruitBasket) {
            throw new Error('aaay')
          }

          return Promise.resolve(ctx)
        },
      },
      ajs,
      storage
    )

    eq.dispatch(fruitBasket)
    eq.dispatch(basketView)
    eq.dispatch(shopper)

    expect(eq.queue.length).toBe(3)

    const flushed = await flushAll(eq)

    // flushed good events
    expect(flushed).toEqual([basketView, shopper])

    // attempted to deliver multiple times
    expect(eq.queue.getAttempts(fruitBasket)).toEqual(2)
  })

  test('waits for critical tasks to finish before performing event deliveries', async () => {
    jest.useRealTimers()

    const eq = new EventQueue()

    let finishCriticalTask: () => void = noop
    const startTask = () =>
      new Promise<void>((res) => (finishCriticalTask = res))

    // some preceding events that've been scheduled
    const p1 = eq.dispatch(fruitBasket)
    const p2 = eq.dispatch(basketView)
    // a critical task has been kicked off
    eq.criticalTasks.run(startTask)
    // a succeeding event
    const p3 = eq.dispatch(shopper)

    // even after a good amount of time, none of the events should be delivered
    await expect(pTimeout(Promise.race([p1, p2, p3]), 1000)).rejects.toThrow()

    // give the green light
    finishCriticalTask()

    // now that the task is complete, the delivery should resume
    expect(await Promise.all([p1, p2, p3])).toMatchObject([
      fruitBasket,
      basketView,
      shopper,
    ])
  })

  test('delivers events on retry', async () => {
    jest.useRealTimers()

    // make sure all backoffs return immediatelly
    jest.spyOn(timer, 'backoff').mockImplementationOnce(() => 100)

    const eq = new EventQueue()

    await eq.register(
      Context.system(),
      {
        ...testPlugin,
        track: (ctx) => {
          // only fail first attempt
          if (ctx === fruitBasket && ctx.attempts === 1) {
            throw new Error('aaay')
          }

          return Promise.resolve(ctx)
        },
      },
      ajs,
      storage
    )

    eq.dispatch(fruitBasket)
    eq.dispatch(basketView)
    eq.dispatch(shopper)

    expect(eq.queue.length).toBe(3)

    let flushed = await flushAll(eq)
    // delivered both basket and shopper
    expect(flushed).toEqual([basketView, shopper])

    // wait for the exponential backoff
    await new Promise((res) => setTimeout(res, 100))

    // second try
    flushed = await flushAll(eq)
    expect(eq.queue.length).toBe(0)

    expect(flushed).toEqual([fruitBasket])
    expect(flushed[0].attempts).toEqual(2)
  })

  test('does not retry non retriable cancelations', async () => {
    const eq = new EventQueue()

    await eq.register(
      Context.system(),
      {
        ...testPlugin,
        track: async (ctx) => {
          if (ctx === fruitBasket) {
            throw new ContextCancelation({ retry: false, reason: 'Test!' })
          }
          return ctx
        },
      },
      ajs,
      storage
    )

    const dispatches = [
      eq.dispatch(fruitBasket),
      eq.dispatch(basketView),
      eq.dispatch(shopper),
    ]

    expect(eq.queue.length).toBe(3)

    const flushed = await Promise.all(dispatches)

    // delivered both basket and shopper
    expect(flushed).toEqual([fruitBasket, basketView, shopper])

    // nothing was retried
    expect(basketView.attempts).toEqual(1)
    expect(shopper.attempts).toEqual(1)
    expect(fruitBasket.attempts).toEqual(1)
    expect(eq.queue.length).toBe(0)
  })

  test('does not retry non retriable cancelations (dispatchSingle)', async () => {
    const eq = new EventQueue()

    await eq.register(
      Context.system(),
      {
        ...testPlugin,
        track: async (ctx) => {
          if (ctx === fruitBasket) {
            throw new ContextCancelation({ retry: false, reason: 'Test!' })
          }
          return ctx
        },
      },
      ajs,
      storage
    )

    const context = await eq.dispatchSingle(fruitBasket)

    expect(context.attempts).toEqual(1)
  })

  test('retries retriable cancelations', async () => {
    // make sure all backoffs return immediatelly
    jest.spyOn(timer, 'backoff').mockImplementationOnce(() => 100)

    const eq = new EventQueue()

    await eq.register(
      Context.system(),
      {
        ...testPlugin,
        track: (ctx) => {
          // only fail first attempt
          if (ctx === fruitBasket && ctx.attempts === 1) {
            ctx.cancel(new ContextCancelation({ retry: true }))
          }

          return Promise.resolve(ctx)
        },
      },
      ajs,
      storage
    )

    eq.dispatch(fruitBasket)
    eq.dispatch(basketView)
    eq.dispatch(shopper)

    expect(eq.queue.length).toBe(3)

    let flushed = await flushAll(eq)
    // delivered both basket and shopper
    expect(flushed).toEqual([basketView, shopper])

    // wait for the exponential backoff
    await new Promise((res) => setTimeout(res, 100))

    // second try
    flushed = await flushAll(eq)
    expect(eq.queue.length).toBe(0)

    expect(flushed).toEqual([fruitBasket])
    expect(flushed[0].attempts).toEqual(2)
  })

  test('client: can block on delivery', async () => {
    jest.useRealTimers()
    const eq = new EventQueue()

    await eq.register(
      Context.system(),
      {
        ...testPlugin,
        track: (ctx) => {
          // only fail first attempt
          if (ctx === fruitBasket && ctx.attempts === 1) {
            throw new Error('aaay')
          }

          return Promise.resolve(ctx)
        },
      },
      ajs,
      storage
    )

    const fruitBasketDelivery = eq.dispatch(fruitBasket)
    const basketViewDelivery = eq.dispatch(basketView)
    const shopperDelivery = eq.dispatch(shopper)

    expect(eq.queue.length).toBe(3)

    const [fruitBasketCtx, basketViewCtx, shopperCtx] = await Promise.all([
      fruitBasketDelivery,
      basketViewDelivery,
      shopperDelivery,
    ])

    expect(eq.queue.length).toBe(0)

    expect(fruitBasketCtx.attempts).toBe(2)
    expect(basketViewCtx.attempts).toBe(1)
    expect(shopperCtx.attempts).toBe(1)
  })

  describe('denyList permutations', () => {
    const amplitude = {
      ...testPlugin,
      name: 'Amplitude',
      type: 'destination' as const,
      track: (ctx: Context): Promise<Context> | Context => {
        return Promise.resolve(ctx)
      },
    }

    const mixPanel = {
      ...testPlugin,
      name: 'Mixpanel',
      type: 'destination' as const,
      track: (ctx: Context): Promise<Context> | Context => {
        return Promise.resolve(ctx)
      },
    }

    const segmentio = {
      ...testPlugin,
      name: 'Segment.io',
      type: 'after' as const,
      track: (ctx: Context): Promise<Context> | Context => {
        return Promise.resolve(ctx)
      },
    }

    test('does not delivery to destinations on denyList', async () => {
      const eq = new EventQueue()

      jest.spyOn(amplitude, 'track')
      jest.spyOn(mixPanel, 'track')
      jest.spyOn(segmentio, 'track')

      const evt = {
        type: 'track' as const,
        integrations: {
          Mixpanel: false,
          'Segment.io': false,
        },
      }

      const ctx = new Context(evt)

      await eq.register(Context.system(), amplitude, ajs, storage)
      await eq.register(Context.system(), mixPanel, ajs, storage)
      await eq.register(Context.system(), segmentio, ajs, storage)

      eq.dispatch(ctx)

      expect(eq.queue.length).toBe(1)

      const flushed = await flushAll(eq)

      expect(flushed).toEqual([ctx])

      expect(mixPanel.track).not.toHaveBeenCalled()
      expect(amplitude.track).toHaveBeenCalled()
      expect(segmentio.track).not.toHaveBeenCalled()
    })

    test('does not deliver to any destination except Segment.io if All: false ', async () => {
      const eq = new EventQueue()

      jest.spyOn(amplitude, 'track')
      jest.spyOn(mixPanel, 'track')
      jest.spyOn(segmentio, 'track')

      const evt = {
        type: 'track' as const,
        integrations: {
          All: false,
        },
      }

      const ctx = new Context(evt)

      await eq.register(Context.system(), amplitude, ajs, storage)
      await eq.register(Context.system(), mixPanel, ajs, storage)
      await eq.register(Context.system(), segmentio, ajs, storage)

      eq.dispatch(ctx)

      expect(eq.queue.length).toBe(1)
      const flushed = await flushAll(eq)

      expect(flushed).toEqual([ctx])

      expect(mixPanel.track).not.toHaveBeenCalled()
      expect(amplitude.track).not.toHaveBeenCalled()
      expect(segmentio.track).toHaveBeenCalled()
    })

    test('does not deliver when All: false and destination is also explicitly false', async () => {
      const eq = new EventQueue()

      jest.spyOn(amplitude, 'track')
      jest.spyOn(mixPanel, 'track')
      jest.spyOn(segmentio, 'track')

      const evt = {
        type: 'track' as const,
        integrations: {
          All: false,
          Amplitude: false,
          'Segment.io': false,
        },
      }

      const ctx = new Context(evt)

      await eq.register(Context.system(), amplitude, ajs, storage)
      await eq.register(Context.system(), mixPanel, ajs, storage)
      await eq.register(Context.system(), segmentio, ajs, storage)

      eq.dispatch(ctx)

      expect(eq.queue.length).toBe(1)
      const flushed = await flushAll(eq)

      expect(flushed).toEqual([ctx])

      expect(mixPanel.track).not.toHaveBeenCalled()
      expect(amplitude.track).not.toHaveBeenCalled()
      expect(segmentio.track).not.toHaveBeenCalled()
    })

    test('delivers to destinations if All: false but the destination is allowed', async () => {
      const eq = new EventQueue()

      jest.spyOn(amplitude, 'track')
      jest.spyOn(mixPanel, 'track')
      jest.spyOn(segmentio, 'track')

      const evt = {
        type: 'track' as const,
        integrations: {
          All: false,
          Amplitude: true,
          'Segment.io': true,
        },
      }

      const ctx = new Context(evt)

      await eq.register(Context.system(), amplitude, ajs, storage)
      await eq.register(Context.system(), mixPanel, ajs, storage)
      await eq.register(Context.system(), segmentio, ajs, storage)

      eq.dispatch(ctx)

      expect(eq.queue.length).toBe(1)
      const flushed = await flushAll(eq)

      expect(flushed).toEqual([ctx])

      expect(mixPanel.track).not.toHaveBeenCalled()
      expect(amplitude.track).toHaveBeenCalled()
      expect(segmentio.track).toHaveBeenCalled()
    })

    test('delivers to Segment.io if All: false but Segment.io is not specified', async () => {
      const eq = new EventQueue()

      jest.spyOn(amplitude, 'track')
      jest.spyOn(mixPanel, 'track')
      jest.spyOn(segmentio, 'track')

      const evt = {
        type: 'track' as const,
        integrations: {
          All: false,
          Amplitude: true,
        },
      }

      const ctx = new Context(evt)

      await eq.register(Context.system(), amplitude, ajs, storage)
      await eq.register(Context.system(), mixPanel, ajs, storage)
      await eq.register(Context.system(), segmentio, ajs, storage)

      eq.dispatch(ctx)

      expect(eq.queue.length).toBe(1)
      const flushed = await flushAll(eq)

      expect(flushed).toEqual([ctx])

      expect(mixPanel.track).not.toHaveBeenCalled()
      expect(amplitude.track).toHaveBeenCalled()
      expect(segmentio.track).toHaveBeenCalled()
    })

    test('delivers to destinations that exist as an object', async () => {
      const eq = new EventQueue()

      jest.spyOn(amplitude, 'track')
      jest.spyOn(segmentio, 'track')

      const evt = {
        type: 'track' as const,
        integrations: {
          All: false,
          Amplitude: {
            amplitudeKey: 'foo',
          },
          'Segment.io': {},
        },
      }

      const ctx = new Context(evt)

      await eq.register(Context.system(), amplitude, ajs, storage)
      await eq.register(Context.system(), segmentio, ajs, storage)

      eq.dispatch(ctx)

      expect(eq.queue.length).toBe(1)
      const flushed = await flushAll(eq)

      expect(flushed).toEqual([ctx])

      expect(amplitude.track).toHaveBeenCalled()
      expect(segmentio.track).toHaveBeenCalled()
    })

    test('delivers to action destinations using alternative names', async () => {
      const eq = new EventQueue()
      const fullstory = new ActionDestination('fullstory', testPlugin)
      fullstory.alternativeNames.push('fullstory trackEvent')
      fullstory.type = 'destination'

      jest.spyOn(fullstory, 'track')
      jest.spyOn(segmentio, 'track')

      const evt = {
        type: 'track' as const,
        integrations: {
          All: false,
          'fullstory trackEvent': true,
          'Segment.io': {},
        },
      }

      const ctx = new Context(evt)

      await eq.register(Context.system(), fullstory, ajs, storage)
      await eq.register(Context.system(), segmentio, ajs, storage)

      eq.dispatch(ctx)

      expect(eq.queue.length).toBe(1)
      const flushed = await flushAll(eq)

      expect(flushed).toEqual([ctx])

      expect(fullstory.track).toHaveBeenCalled()
      expect(segmentio.track).toHaveBeenCalled()
    })

    test('respect deny lists generated by other plugin', async () => {
      const eq = new EventQueue()

      jest.spyOn(amplitude, 'track')
      jest.spyOn(mixPanel, 'track')
      jest.spyOn(segmentio, 'track')

      const evt = {
        type: 'track' as const,
        integrations: {
          Amplitude: true,
          MixPanel: true,
          'Segment.io': true,
        },
      }

      const ctx = new Context(evt)
      await eq.register(Context.system(), amplitude, ajs, storage)
      await eq.register(Context.system(), mixPanel, ajs, storage)
      await eq.register(Context.system(), segmentio, ajs, storage)
      await eq.dispatch(ctx)

      const skipAmplitudeAndSegment: MiddlewareFunction = ({
        payload,
        next,
      }) => {
        if (!payload.obj.integrations) {
          payload.obj.integrations = {}
        }

        payload.obj.integrations['Amplitude'] = false
        payload.obj.integrations['Segment.io'] = false
        next(payload)
      }

      await eq.register(
        Context.system(),
        sourceMiddlewarePlugin(skipAmplitudeAndSegment, {}),
        ajs,
        storage
      )

      await eq.dispatch(ctx)

      expect(mixPanel.track).toHaveBeenCalledTimes(2)
      expect(amplitude.track).toHaveBeenCalledTimes(1)
      expect(segmentio.track).toHaveBeenCalledTimes(1)
    })
  })
})

describe('deregister', () => {
  it('remove plugin from plugins list', async () => {
    const eq = new EventQueue()
    const toBeRemoved = { ...testPlugin, name: 'remove-me' }
    const plugins = [testPlugin, toBeRemoved]

    const promises = plugins.map((p) =>
      eq.register(Context.system(), p, ajs, storage)
    )
    await Promise.all(promises)

    await eq.deregister(Context.system(), toBeRemoved, ajs)
    expect(eq.plugins.length).toBe(1)
    expect(eq.plugins[0]).toBe(testPlugin)
  })

  it('invokes plugin.unload', async () => {
    const eq = new EventQueue()
    const toBeRemoved = { ...testPlugin, name: 'remove-me', unload: jest.fn() }
    const plugins = [testPlugin, toBeRemoved]

    const promises = plugins.map((p) =>
      eq.register(Context.system(), p, ajs, storage)
    )
    await Promise.all(promises)

    await eq.deregister(Context.system(), toBeRemoved, ajs)
    expect(toBeRemoved.unload).toHaveBeenCalled()
    expect(eq.plugins.length).toBe(1)
    expect(eq.plugins[0]).toBe(testPlugin)
  })
})

describe('dispatchSingle', () => {
  it('dispatches events without placing them on the queue', async () => {
    const eq = new EventQueue()
    const promise = eq.dispatchSingle(fruitBasket)

    expect(eq.queue.length).toBe(0)
    await promise
    expect(eq.queue.length).toBe(0)
  })

  it('records delivery metrics', async () => {
    const eq = new EventQueue()
    const ctx = await eq.dispatchSingle(
      new Context({
        type: 'track',
      })
    )

    expect(ctx.logs().map((l) => l.message)).toMatchInlineSnapshot(`
      Array [
        "Dispatching",
        "Delivered",
      ]
    `)

    expect(ctx.stats.metrics.map((m) => m.metric)).toMatchInlineSnapshot(`
      Array [
        "message_dispatched",
        "message_delivered",
        "delivered",
      ]
    `)
  })

  test('retries retriable cancelations', async () => {
    // make sure all backoffs return immediatelly
    jest.spyOn(timer, 'backoff').mockImplementationOnce(() => 100)

    const eq = new EventQueue()

    await eq.register(
      Context.system(),
      {
        ...testPlugin,
        track: (ctx) => {
          // only fail first attempt
          if (ctx === fruitBasket && ctx.attempts === 1) {
            ctx.cancel(new ContextCancelation({ retry: true }))
          }

          return Promise.resolve(ctx)
        },
      },
      ajs,
      storage
    )

    expect(eq.queue.length).toBe(0)

    const attempted = await eq.dispatchSingle(fruitBasket)
    expect(attempted.attempts).toEqual(2)
  })
})
