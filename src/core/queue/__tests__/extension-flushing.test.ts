import { shuffle } from 'lodash'
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

const testExtension: Extension = {
  name: 'test',
  type: 'before',
  version: '0.1.0',
  load: () => Promise.resolve(),
  isLoaded: () => true,
}

const ajs = {} as Analytics

describe('Registration', () => {
  test('can register extensions', async () => {
    const eq = new EventQueue()
    const load = jest.fn()

    const extension: Extension = {
      name: 'test',
      type: 'before',
      version: '0.1.0',
      load,
      isLoaded: () => true,
    }

    const ctx = Context.system()
    await eq.register(ctx, extension, ajs)

    expect(load).toHaveBeenCalledWith(ctx, ajs)
  })

  test('fails if extension cant be loaded', async () => {
    const eq = new EventQueue()

    const extension: Extension = {
      name: 'test',
      type: 'before',
      version: '0.1.0',
      load: () => Promise.reject(new Error('👻')),
      isLoaded: () => false,
    }

    const ctx = Context.system()
    await expect(eq.register(ctx, extension, ajs)).rejects.toThrowErrorMatchingInlineSnapshot(`"👻"`)
  })

  test('allows for destinations to fail registration', async () => {
    const eq = new EventQueue()

    const extension: Extension = {
      name: 'test',
      type: 'destination',
      version: '0.1.0',
      load: () => Promise.reject(new Error('👻')),
      isLoaded: () => false,
    }

    const ctx = Context.system()
    await eq.register(ctx, extension, ajs)

    expect(ctx.logs()[0].level).toEqual('warn')
    expect(ctx.logs()[0].message).toEqual('Failed to load destination')
  })
})

describe('Extension flushing', () => {
  test('ensures `before` extensions are run', async () => {
    const eq = new EventQueue()

    await eq.register(
      Context.system(),
      {
        ...testExtension,
        type: 'before',
      },
      ajs
    )

    const flushed = await eq.dispatch(fruitBasket)
    expect(flushed.logs().map((l) => l.message)).toContain('Delivered')

    await eq.register(
      Context.system(),
      {
        ...testExtension,
        name: 'Faulty before',
        type: 'before',
        track: () => {
          throw new Error('aaay')
        },
      },
      ajs
    )

    const failedFlush: Context = await eq
      .dispatch(
        new Context({
          type: 'track',
        })
      )
      .catch((ctx) => ctx)

    const messages = failedFlush.logs().map((l) => l.message)
    expect(messages).not.toContain('Delivered')
  })

  test('atempts `enrichment` extensions', async () => {
    const eq = new EventQueue()

    await eq.register(
      Context.system(),
      {
        ...testExtension,
        name: 'Faulty enrichment',
        type: 'enrichment',
        track: () => {
          throw new Error('aaay')
        },
      },
      ajs
    )

    const flushed = await eq.dispatch(
      new Context({
        type: 'track',
      })
    )

    const messages = flushed.logs().map((l) => l.message)
    expect(messages).toContain('Delivered')
  })

  test('attempts `destination` extensions', async () => {
    const eq = new EventQueue()

    const amplitude: Extension = {
      ...testExtension,
      name: 'Amplitude',
      type: 'destination',
      track: async () => {
        throw new Error('Boom!')
      },
    }

    const fullstory: Extension = {
      ...testExtension,
      name: 'FullStory',
      type: 'destination',
    }

    await eq.register(Context.system(), amplitude, ajs)
    await eq.register(Context.system(), fullstory, ajs)

    const flushed = await eq.dispatch(
      new Context({
        type: 'track',
      })
    )

    const messages = flushed.logs().map((l) => ({ message: l.message, extras: l.extras }))
    expect(messages).toMatchInlineSnapshot(`
      Array [
        Object {
          "extras": undefined,
          "message": "Dispatching",
        },
        Object {
          "extras": Object {
            "extension": "Amplitude",
          },
          "message": "extension",
        },
        Object {
          "extras": Object {
            "extension": "FullStory",
          },
          "message": "extension",
        },
        Object {
          "extras": Object {
            "error": [Error: Boom!],
            "extension": "Amplitude",
          },
          "message": "extension Error",
        },
        Object {
          "extras": Object {
            "context": Object {
              "attempts": 1,
            },
            "type": "track",
          },
          "message": "Delivered",
        },
      ]
    `)
  })

  test('attempts `after` extensions', async () => {
    const eq = new EventQueue()

    const afterFailed: Extension = {
      ...testExtension,
      name: 'after-failed',
      type: 'after',
      track: async () => {
        throw new Error('Boom!')
      },
    }

    const after: Extension = {
      ...testExtension,
      name: 'after',
      type: 'after',
    }

    await eq.register(Context.system(), afterFailed, ajs)
    await eq.register(Context.system(), after, ajs)

    const flushed = await eq.dispatch(
      new Context({
        type: 'track',
      })
    )

    const messages = flushed.logs().map((l) => ({ message: l.message, extras: l.extras }))
    expect(messages).toMatchInlineSnapshot(`
      Array [
        Object {
          "extras": undefined,
          "message": "Dispatching",
        },
        Object {
          "extras": Object {
            "extension": "after-failed",
          },
          "message": "extension",
        },
        Object {
          "extras": Object {
            "extension": "after",
          },
          "message": "extension",
        },
        Object {
          "extras": Object {
            "error": [Error: Boom!],
            "extension": "after-failed",
          },
          "message": "extension Error",
        },
        Object {
          "extras": Object {
            "context": Object {
              "attempts": 1,
            },
            "type": "track",
          },
          "message": "Delivered",
        },
      ]
    `)
  })

  test('runs `enrichment` and `before` inline', async () => {
    const eq = new EventQueue()

    await eq.register(
      Context.system(),
      {
        ...testExtension,
        name: 'Kiwi',
        type: 'enrichment',
        track: async (ctx) => {
          ctx.updateEvent('properties.kiwi', '🥝')
          return ctx
        },
      },
      ajs
    )

    await eq.register(
      Context.system(),
      {
        ...testExtension,
        name: 'Watermelon',
        type: 'enrichment',
        track: async (ctx) => {
          ctx.updateEvent('properties.watermelon', '🍉')
          return ctx
        },
      },
      ajs
    )

    await eq.register(
      Context.system(),
      {
        ...testExtension,
        name: 'Before',
        type: 'before',
        track: async (ctx) => {
          ctx.stats.increment('before')
          return ctx
        },
      },
      ajs
    )

    const flushed = await eq.dispatch(
      new Context({
        type: 'track',
      })
    )

    expect(flushed.event.properties).toEqual({
      watermelon: '🍉',
      kiwi: '🥝',
    })

    expect(flushed.stats.metrics.map((m) => m.metric)).toContain('before')
  })

  test('respects execution order', async () => {
    const eq = new EventQueue()

    let trace = 0

    const before: Extension = {
      ...testExtension,
      name: 'Before',
      type: 'before',
      track: async (ctx) => {
        trace++
        expect(trace).toBe(1)
        return ctx
      },
    }

    const enrichment: Extension = {
      ...testExtension,
      name: 'Enrichment',
      type: 'enrichment',
      track: async (ctx) => {
        trace++
        expect(trace === 2 || trace === 3).toBe(true)
        return ctx
      },
    }

    const enrichmentTwo: Extension = {
      ...testExtension,
      name: 'Enrichment 2',
      type: 'enrichment',
      track: async (ctx) => {
        trace++
        expect(trace === 2 || trace === 3).toBe(true)
        return ctx
      },
    }

    const destination: Extension = {
      ...testExtension,
      name: 'Destination',
      type: 'destination',
      track: async (ctx) => {
        trace++
        expect(trace).toBe(4)
        return ctx
      },
    }

    // shuffle extensions so we can verify order
    const extensions = shuffle([before, enrichment, enrichmentTwo, destination])
    for (const xt of extensions) {
      await eq.register(Context.system(), xt, ajs)
    }

    await eq.dispatch(
      new Context({
        type: 'track',
      })
    )

    expect(trace).toBe(4)
  })
})
