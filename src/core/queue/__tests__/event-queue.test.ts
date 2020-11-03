/* eslint-disable @typescript-eslint/no-floating-promises */
import { Analytics } from '../../../analytics'
import { Context } from '../../context'
import { Extension } from '../../extension'
import { EventQueue } from '../event-queue'

const fruitBasket = new Context({
  type: 'track',
  event: 'Fruit Basket',
  properties: {
    banana: '🍌',
    apple: '🍎',
    grape: '🍇',
  },
})

const basketView = new Context({
  type: 'page',
})

const shopper = new Context({
  type: 'identify',
  traits: {
    name: 'Netto Farah',
  },
})

const testExtension: Extension = {
  name: 'test',
  type: 'before',
  version: '0.1.0',
  load: () => Promise.resolve(),
  isLoaded: () => true,
}

const ajs = {} as Analytics

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

  expect(setTimeout).toHaveBeenCalled()
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

  expect(setTimeout).toHaveBeenCalledTimes(1)
  expect(eq.queue.length).toBe(2)

  jest.runAllTimers()
  await eq.flush()

  expect(eq.queue.length).toBe(0)
})

describe('Flushing', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  test('works until the queue is empty', async () => {
    const eq = new EventQueue()

    eq.dispatch(fruitBasket)
    eq.dispatch(basketView)
    eq.dispatch(shopper)

    expect(eq.queue.length).toBe(3)

    const flushed = await eq.flush()

    expect(eq.queue.length).toBe(0)
    expect(flushed).toEqual([fruitBasket, basketView, shopper])
  })

  test('re-queues failed events', async () => {
    const eq = new EventQueue()

    await eq.register(
      Context.system(),
      {
        ...testExtension,
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

    const flushed = await eq.flush()

    // flushed good events
    expect(flushed).toEqual([basketView, shopper])

    // attempted to deliver multiple times
    expect(eq.queue.getAttempts(fruitBasket)).toEqual(2)
  })

  test('delivers events on retry', async () => {
    const eq = new EventQueue()

    await eq.register(
      Context.system(),
      {
        ...testExtension,
        track: (ctx) => {
          // only fail first attempt
          if (ctx === fruitBasket && ctx.event.context?.attempts === 1) {
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

    let flushed = await eq.flush()
    // delivered both basket and shopper
    expect(flushed).toEqual([basketView, shopper])

    // second try
    flushed = await eq.flush()
    expect(eq.queue.length).toBe(0)

    expect(flushed).toEqual([fruitBasket])
    expect(flushed[0].event.context?.attempts).toEqual(2)
  })

  test('client: can block on delivery', async () => {
    jest.useRealTimers()
    const eq = new EventQueue()

    await eq.register(
      Context.system(),
      {
        ...testExtension,
        track: (ctx) => {
          // only fail first attempt
          if (ctx === fruitBasket && ctx.event.context?.attempts === 1) {
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

    const [fruitBasketCtx, basketViewCtx, shopperCtx] = await Promise.all([fruitBasketDelivery, basketViewDelivery, shopperDelivery])

    expect(eq.queue.length).toBe(0)

    expect(fruitBasketCtx.event.context?.attempts).toBe(2)
    expect(basketViewCtx.event.context?.attempts).toBe(1)
    expect(shopperCtx.event.context?.attempts).toBe(1)
  })
})
