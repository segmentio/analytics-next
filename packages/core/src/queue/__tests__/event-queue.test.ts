/* eslint-disable @typescript-eslint/no-floating-promises */
import { noop } from 'lodash'
import { CoreAnalytics } from '../../analytics'
import { pWhile } from '../../utils/p-while'
import * as timer from '../../priority-queue/backoff'
import { ContextCancelation } from '../../context'
import { CorePlugin, PluginType } from '../../plugins'
import { pTimeout } from '../../callback'
import { TestCtx, TestEventQueue } from '../../../test-helpers'

async function flushAll(eq: TestEventQueue): Promise<TestCtx[]> {
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

const testPlugin: CorePlugin = {
  name: 'test',
  type: 'before',
  version: '0.1.0',
  load: () => Promise.resolve(),
  isLoaded: () => true,
}

const ajs = {} as CoreAnalytics

let fruitBasket: TestCtx, basketView: TestCtx, shopper: TestCtx

beforeEach(() => {
  fruitBasket = new TestCtx({
    type: 'track',
    event: 'Fruit Basket',
    properties: {
      banana: '🍌',
      apple: '🍎',
      grape: '🍇',
    },
  })

  basketView = new TestCtx({
    type: 'page',
  })

  shopper = new TestCtx({
    type: 'identify',
    traits: {
      name: 'Netto Farah',
    },
  })
})

test('can send events', async () => {
  const eq = new TestEventQueue()
  const evt = await eq.dispatch(fruitBasket)
  expect(evt).toBe(fruitBasket)
})

test('delivers events out of band', async () => {
  jest.useFakeTimers()

  const eq = new TestEventQueue()

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

  const eq = new TestEventQueue()

  const anothaOne = new TestCtx({
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
    const eq = new TestEventQueue()

    eq.dispatch(fruitBasket)
    eq.dispatch(basketView)
    eq.dispatch(shopper)

    expect(eq.queue.length).toBe(3)

    const flushed = await flushAll(eq)

    expect(eq.queue.length).toBe(0)
    expect(flushed).toEqual([fruitBasket, basketView, shopper])
  })

  test('re-queues failed events', async () => {
    const eq = new TestEventQueue()

    await eq.register(
      TestCtx.system(),
      {
        ...testPlugin,
        track: (ctx) => {
          if (ctx === fruitBasket) {
            throw new Error('aaay')
          }

          return Promise.resolve(ctx)
        },
      },
      ajs
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

    const eq = new TestEventQueue()

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

    const eq = new TestEventQueue()

    await eq.register(
      TestCtx.system(),
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
      ajs
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
    const eq = new TestEventQueue()

    await eq.register(
      TestCtx.system(),
      {
        ...testPlugin,
        track: async (ctx) => {
          if (ctx === fruitBasket) {
            throw new ContextCancelation({ retry: false, reason: 'Test!' })
          }
          return ctx
        },
      },
      ajs
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
    const eq = new TestEventQueue()

    await eq.register(
      TestCtx.system(),
      {
        ...testPlugin,
        track: async (ctx) => {
          if (ctx === fruitBasket) {
            throw new ContextCancelation({ retry: false, reason: 'Test!' })
          }
          return ctx
        },
      },
      ajs
    )

    const context = await eq.dispatchSingle(fruitBasket)

    expect(context.attempts).toEqual(1)
  })

  test('retries retriable cancelations', async () => {
    // make sure all backoffs return immediatelly
    jest.spyOn(timer, 'backoff').mockImplementationOnce(() => 100)

    const eq = new TestEventQueue()

    await eq.register(
      TestCtx.system(),
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
      ajs
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
    const eq = new TestEventQueue()

    await eq.register(
      TestCtx.system(),
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
      ajs
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
      track: (ctx: TestCtx): Promise<TestCtx> | TestCtx => {
        return Promise.resolve(ctx)
      },
    }

    const mixPanel = {
      ...testPlugin,
      name: 'Mixpanel',
      type: 'destination' as const,
      track: (ctx: TestCtx): Promise<TestCtx> | TestCtx => {
        return Promise.resolve(ctx)
      },
    }

    const segmentio = {
      ...testPlugin,
      name: 'Segment.io',
      type: 'after' as const,
      track: (ctx: TestCtx): Promise<TestCtx> | TestCtx => {
        return Promise.resolve(ctx)
      },
    }

    test('does not delivery to destinations on denyList', async () => {
      const eq = new TestEventQueue()

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

      const ctx = new TestCtx(evt)

      await eq.register(TestCtx.system(), amplitude, ajs)
      await eq.register(TestCtx.system(), mixPanel, ajs)
      await eq.register(TestCtx.system(), segmentio, ajs)

      eq.dispatch(ctx)

      expect(eq.queue.length).toBe(1)

      const flushed = await flushAll(eq)

      expect(flushed).toEqual([ctx])

      expect(mixPanel.track).not.toHaveBeenCalled()
      expect(amplitude.track).toHaveBeenCalled()
      expect(segmentio.track).not.toHaveBeenCalled()
    })

    test('does not deliver to any destination except Segment.io if All: false ', async () => {
      const eq = new TestEventQueue()

      jest.spyOn(amplitude, 'track')
      jest.spyOn(mixPanel, 'track')
      jest.spyOn(segmentio, 'track')

      const evt = {
        type: 'track' as const,
        integrations: {
          All: false,
        },
      }

      const ctx = new TestCtx(evt)

      await eq.register(TestCtx.system(), amplitude, ajs)
      await eq.register(TestCtx.system(), mixPanel, ajs)
      await eq.register(TestCtx.system(), segmentio, ajs)

      eq.dispatch(ctx)

      expect(eq.queue.length).toBe(1)
      const flushed = await flushAll(eq)

      expect(flushed).toEqual([ctx])

      expect(mixPanel.track).not.toHaveBeenCalled()
      expect(amplitude.track).not.toHaveBeenCalled()
      expect(segmentio.track).toHaveBeenCalled()
    })

    test('does not deliver when All: false and destination is also explicitly false', async () => {
      const eq = new TestEventQueue()

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

      const ctx = new TestCtx(evt)

      await eq.register(TestCtx.system(), amplitude, ajs)
      await eq.register(TestCtx.system(), mixPanel, ajs)
      await eq.register(TestCtx.system(), segmentio, ajs)

      eq.dispatch(ctx)

      expect(eq.queue.length).toBe(1)
      const flushed = await flushAll(eq)

      expect(flushed).toEqual([ctx])

      expect(mixPanel.track).not.toHaveBeenCalled()
      expect(amplitude.track).not.toHaveBeenCalled()
      expect(segmentio.track).not.toHaveBeenCalled()
    })

    test('delivers to destinations if All: false but the destination is allowed', async () => {
      const eq = new TestEventQueue()

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

      const ctx = new TestCtx(evt)

      await eq.register(TestCtx.system(), amplitude, ajs)
      await eq.register(TestCtx.system(), mixPanel, ajs)
      await eq.register(TestCtx.system(), segmentio, ajs)

      eq.dispatch(ctx)

      expect(eq.queue.length).toBe(1)
      const flushed = await flushAll(eq)

      expect(flushed).toEqual([ctx])

      expect(mixPanel.track).not.toHaveBeenCalled()
      expect(amplitude.track).toHaveBeenCalled()
      expect(segmentio.track).toHaveBeenCalled()
    })

    test('delivers to Segment.io if All: false but Segment.io is not specified', async () => {
      const eq = new TestEventQueue()

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

      const ctx = new TestCtx(evt)

      await eq.register(TestCtx.system(), amplitude, ajs)
      await eq.register(TestCtx.system(), mixPanel, ajs)
      await eq.register(TestCtx.system(), segmentio, ajs)

      eq.dispatch(ctx)

      expect(eq.queue.length).toBe(1)
      const flushed = await flushAll(eq)

      expect(flushed).toEqual([ctx])

      expect(mixPanel.track).not.toHaveBeenCalled()
      expect(amplitude.track).toHaveBeenCalled()
      expect(segmentio.track).toHaveBeenCalled()
    })

    test('delivers to destinations that exist as an object', async () => {
      const eq = new TestEventQueue()

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

      const ctx = new TestCtx(evt)

      await eq.register(TestCtx.system(), amplitude, ajs)
      await eq.register(TestCtx.system(), segmentio, ajs)

      eq.dispatch(ctx)

      expect(eq.queue.length).toBe(1)
      const flushed = await flushAll(eq)

      expect(flushed).toEqual([ctx])

      expect(amplitude.track).toHaveBeenCalled()
      expect(segmentio.track).toHaveBeenCalled()
    })
  })
})

describe('register', () => {
  it('only filters out failed destinations after loading', async () => {
    jest.spyOn(console, 'warn').mockImplementation(noop)
    const eq = new TestEventQueue()
    const goodDestinationPlugin = {
      ...testPlugin,
      name: 'good destination',
      type: 'destination' as PluginType,
    }
    const failingPlugin = {
      ...testPlugin,
      name: 'failing',
      type: 'destination' as PluginType,

      load: () => Promise.reject(new Error('I was born to throw')),
    }

    const plugins = [testPlugin, goodDestinationPlugin, failingPlugin]
    const promises = plugins.map((p) => eq.register(TestCtx.system(), p, ajs))
    await Promise.all(promises)

    expect(eq.plugins.length).toBe(2)
    expect(eq.plugins).toContain(testPlugin)
    expect(eq.plugins).toContain(goodDestinationPlugin)
  })
})

describe('deregister', () => {
  it('remove plugin from plugins list', async () => {
    const eq = new TestEventQueue()
    const toBeRemoved = { ...testPlugin, name: 'remove-me' }
    const plugins = [testPlugin, toBeRemoved]

    const promises = plugins.map((p) => eq.register(TestCtx.system(), p, ajs))
    await Promise.all(promises)

    await eq.deregister(TestCtx.system(), toBeRemoved, ajs)
    expect(eq.plugins.length).toBe(1)
    expect(eq.plugins[0]).toBe(testPlugin)
  })

  it('invokes plugin.unload', async () => {
    const eq = new TestEventQueue()
    const toBeRemoved = { ...testPlugin, name: 'remove-me', unload: jest.fn() }
    const plugins = [testPlugin, toBeRemoved]

    const promises = plugins.map((p) => eq.register(TestCtx.system(), p, ajs))
    await Promise.all(promises)

    await eq.deregister(TestCtx.system(), toBeRemoved, ajs)
    expect(toBeRemoved.unload).toHaveBeenCalled()
    expect(eq.plugins.length).toBe(1)
    expect(eq.plugins[0]).toBe(testPlugin)
  })
})

describe('dispatchSingle', () => {
  it('dispatches events without placing them on the queue', async () => {
    const eq = new TestEventQueue()
    const promise = eq.dispatchSingle(fruitBasket)

    expect(eq.queue.length).toBe(0)
    await promise
    expect(eq.queue.length).toBe(0)
  })

  test('retries retriable cancelations', async () => {
    // make sure all backoffs return immediatelly
    jest.spyOn(timer, 'backoff').mockImplementationOnce(() => 100)

    const eq = new TestEventQueue()

    await eq.register(
      TestCtx.system(),
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
      ajs
    )

    expect(eq.queue.length).toBe(0)

    const attempted = await eq.dispatchSingle(fruitBasket)
    expect(attempted.attempts).toEqual(2)
  })
})

describe('failedDelivery handling', () => {
  // This test suite verifies the fix for the bug where plugins that set
  // failedDelivery without throwing (like the Node SDK Publisher on rate limiting)
  // would incorrectly log "Delivered" instead of logging a failure.

  const destinationPlugin: CorePlugin<TestCtx> = {
    ...testPlugin,
    name: 'Test Destination',
    type: 'destination' as PluginType,
  }

  test('emits delivery_failure when plugin sets failedDelivery without throwing', async () => {
    const eq = new TestEventQueue()

    const failingDestination = {
      ...destinationPlugin,
      track: (ctx: TestCtx): Promise<TestCtx> => {
        // Simulate what the Node SDK Publisher does on rate limiting:
        // set failedDelivery but resolve the promise (don't throw)
        ctx.setFailedDelivery({ reason: new Error('Rate limited (429)') })
        return Promise.resolve(ctx)
      },
    }

    await eq.register(TestCtx.system(), failingDestination, ajs)

    const deliveryFailureSpy = jest.fn()
    const deliverySuccessSpy = jest.fn()
    eq.on('delivery_failure', deliveryFailureSpy)
    eq.on('delivery_success', deliverySuccessSpy)

    await eq.dispatch(fruitBasket)
    await flushAll(eq)

    expect(deliveryFailureSpy).toHaveBeenCalledTimes(1)
    expect(deliverySuccessSpy).not.toHaveBeenCalled()
  })

  test('does not log "Delivered" when failedDelivery is set', async () => {
    const eq = new TestEventQueue()

    const failingDestination = {
      ...destinationPlugin,
      track: (ctx: TestCtx): Promise<TestCtx> => {
        ctx.setFailedDelivery({ reason: new Error('Rate limited (429)') })
        return Promise.resolve(ctx)
      },
    }

    await eq.register(TestCtx.system(), failingDestination, ajs)

    const ctx = await eq.dispatch(fruitBasket)
    await flushAll(eq)

    const logs = ctx.logs()
    const deliveredLog = logs.find(
      (log) => log.message === 'Delivered' && log.level === 'debug'
    )
    const failedLog = logs.find(
      (log) => log.message === 'Failed to deliver' && log.level === 'error'
    )

    expect(deliveredLog).toBeUndefined()
    expect(failedLog).toBeDefined()
  })

  test('increments delivery_failed metric when failedDelivery is set', async () => {
    const eq = new TestEventQueue()

    const failingDestination = {
      ...destinationPlugin,
      track: (ctx: TestCtx): Promise<TestCtx> => {
        ctx.setFailedDelivery({ reason: new Error('Rate limited (429)') })
        return Promise.resolve(ctx)
      },
    }

    await eq.register(TestCtx.system(), failingDestination, ajs)

    // Spy on the stats methods to verify the correct one is called
    const incrementSpy = jest.spyOn(fruitBasket.stats, 'increment')
    const gaugeSpy = jest.spyOn(fruitBasket.stats, 'gauge')

    await eq.dispatch(fruitBasket)
    await flushAll(eq)

    // Should increment delivery_failed, not gauge delivered
    expect(incrementSpy).toHaveBeenCalledWith('delivery_failed')
    expect(gaugeSpy).not.toHaveBeenCalledWith('delivered', expect.any(Number))
  })

  test('flush event receives delivered=false when failedDelivery is set', async () => {
    const eq = new TestEventQueue()

    const failingDestination = {
      ...destinationPlugin,
      track: (ctx: TestCtx): Promise<TestCtx> => {
        ctx.setFailedDelivery({ reason: new Error('Rate limited (429)') })
        return Promise.resolve(ctx)
      },
    }

    await eq.register(TestCtx.system(), failingDestination, ajs)

    const flushSpy = jest.fn()
    eq.on('flush', flushSpy)

    await eq.dispatch(fruitBasket)
    await flushAll(eq)

    expect(flushSpy).toHaveBeenCalledWith(
      expect.any(TestCtx),
      false // delivered should be false
    )
  })

  test('handles non-Error failedDelivery reasons', async () => {
    const eq = new TestEventQueue()

    const failingDestination = {
      ...destinationPlugin,
      track: (ctx: TestCtx): Promise<TestCtx> => {
        // Some code might set a string or other value as the reason
        ctx.setFailedDelivery({ reason: 'Something went wrong' })
        return Promise.resolve(ctx)
      },
    }

    await eq.register(TestCtx.system(), failingDestination, ajs)

    const deliveryFailureSpy = jest.fn()
    eq.on('delivery_failure', deliveryFailureSpy)

    await eq.dispatch(fruitBasket)
    await flushAll(eq)

    expect(deliveryFailureSpy).toHaveBeenCalledTimes(1)
    // The error should be wrapped in an Error object
    expect(deliveryFailureSpy).toHaveBeenCalledWith(
      expect.any(TestCtx),
      expect.objectContaining({ message: 'Something went wrong' })
    )
  })

  test('successful delivery still works correctly', async () => {
    const eq = new TestEventQueue()

    const successfulDestination = {
      ...destinationPlugin,
      track: (ctx: TestCtx): Promise<TestCtx> => {
        // No failedDelivery set - should succeed normally
        return Promise.resolve(ctx)
      },
    }

    await eq.register(TestCtx.system(), successfulDestination, ajs)

    const deliveryFailureSpy = jest.fn()
    const deliverySuccessSpy = jest.fn()
    eq.on('delivery_failure', deliveryFailureSpy)
    eq.on('delivery_success', deliverySuccessSpy)

    const ctx = await eq.dispatch(fruitBasket)
    await flushAll(eq)

    expect(deliverySuccessSpy).toHaveBeenCalledTimes(1)
    expect(deliveryFailureSpy).not.toHaveBeenCalled()

    const logs = ctx.logs()
    const deliveredLog = logs.find(
      (log) => log.message === 'Delivered' && log.level === 'debug'
    )
    expect(deliveredLog).toBeDefined()
  })
})
