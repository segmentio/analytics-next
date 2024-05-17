import { shuffle } from 'lodash'
import { CoreAnalytics } from '../../analytics'
import { PriorityQueue } from '../../priority-queue'
import { CorePlugin as Plugin } from '../../plugins'
import { CoreEventQueue } from '../event-queue'
import { TestCtx } from '../../../test-helpers'

class EventQueue extends CoreEventQueue {
  constructor() {
    super(new PriorityQueue(4, []))
  }
}

const fruitBasket = new TestCtx({
  type: 'track',
  event: 'Fruit Basket',
  properties: {
    banana: '🍌',
    apple: '🍎',
    grape: '🍇',
  },
})

const testPlugin: Plugin = {
  name: 'test',
  type: 'before',
  version: '0.1.0',
  load: () => Promise.resolve(),
  isLoaded: () => true,
}

const ajs = {} as CoreAnalytics

// get rid of console spam for thrown errors.
jest.spyOn(console, 'warn').mockImplementation(() => {})

describe('Registration', () => {
  test('can register plugins', async () => {
    const eq = new EventQueue()
    const load = jest.fn()

    const plugin: Plugin = {
      name: 'test',
      type: 'before',
      version: '0.1.0',
      load,
      isLoaded: () => true,
    }

    const ctx = TestCtx.system()
    await eq.register(ctx, plugin, ajs)

    expect(load).toHaveBeenCalledWith(ctx, ajs)
  })

  test('does not reject if a plugin cant be loaded', async () => {
    const eq = new EventQueue()

    const plugin: Plugin = {
      name: 'test',
      type: 'before',
      version: '0.1.0',
      load: () => Promise.reject(new Error('👻')),
      isLoaded: () => false,
    }

    const ctx = TestCtx.system()
    await expect(eq.register(ctx, plugin, ajs)).resolves.toBe(undefined)
  })

  test('allows for destinations to fail registration', async () => {
    const eq = new EventQueue()

    const plugin: Plugin = {
      name: 'test',
      type: 'destination',
      version: '0.1.0',
      load: () => Promise.reject(new Error('👻')),
      isLoaded: () => false,
    }

    const ctx = TestCtx.system()
    await eq.register(ctx, plugin, ajs)

    expect(ctx.logs()[0].level).toEqual('warn')
    expect(ctx.logs()[0].message).toEqual('Failed to load destination')
  })
})

describe('Plugin flushing', () => {
  test('ensures `before` plugins are run', async () => {
    const eq = new EventQueue()
    const queue = new PriorityQueue(1, [])

    eq.queue = queue

    await eq.register(
      TestCtx.system(),
      {
        ...testPlugin,
        type: 'before',
      },
      ajs
    )

    const flushed = await eq.dispatch(fruitBasket)
    expect(flushed.logs().map((l) => l.message)).toContain('Delivered')

    await eq.register(
      TestCtx.system(),
      {
        ...testPlugin,
        name: 'Faulty before',
        type: 'before',
        track: () => {
          throw new Error('aaay')
        },
      },
      ajs
    )

    const failedFlush: TestCtx = await eq
      .dispatch(
        new TestCtx({
          type: 'track',
        })
      )
      .catch((ctx) => ctx)

    const messages = failedFlush.logs().map((l) => l.message)
    expect(messages).not.toContain('Delivered')
  })

  test('atempts `enrichment` plugins', async () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null)
    const eq = new EventQueue()

    await eq.register(
      TestCtx.system(),
      {
        ...testPlugin,
        name: 'Faulty enrichment',
        type: 'enrichment',
        track: () => {
          throw new Error('aaay')
        },
      },
      ajs
    )

    const flushed = await eq.dispatch(
      new TestCtx({
        type: 'track',
      })
    )

    const messages = flushed.logs().map((l) => l.message)
    expect(messages).toContain('Delivered')
  })

  test('attempts `destination` plugins', async () => {
    const eq = new EventQueue()

    const amplitude: Plugin = {
      ...testPlugin,
      name: 'Amplitude',
      type: 'destination',
      track: async () => {
        throw new Error('Boom!')
      },
    }

    const fullstory: Plugin = {
      ...testPlugin,
      name: 'FullStory',
      type: 'destination',
    }

    await eq.register(TestCtx.system(), amplitude, ajs)
    await eq.register(TestCtx.system(), fullstory, ajs)

    const flushed = await eq.dispatch(
      new TestCtx({
        type: 'track',
      })
    )

    const messages = flushed
      .logs()
      .map((l) => ({ message: l.message, extras: l.extras }))

    expect(messages).toMatchInlineSnapshot(`
      [
        {
          "extras": undefined,
          "message": "Dispatching",
        },
        {
          "extras": {
            "plugin": "Amplitude",
          },
          "message": "plugin",
        },
        {
          "extras": {
            "plugin": "FullStory",
          },
          "message": "plugin",
        },
        {
          "extras": {
            "error": [Error: Boom!],
            "plugin": "Amplitude",
          },
          "message": "plugin Error",
        },
        {
          "extras": {
            "type": "track",
          },
          "message": "Delivered",
        },
      ]
    `)
  })

  test('attempts `after` plugins', async () => {
    const eq = new EventQueue()

    const afterFailed: Plugin = {
      ...testPlugin,
      name: 'after-failed',
      type: 'after',
      track: async () => {
        throw new Error('Boom!')
      },
    }

    const after: Plugin = {
      ...testPlugin,
      name: 'after',
      type: 'after',
    }

    await eq.register(TestCtx.system(), afterFailed, ajs)
    await eq.register(TestCtx.system(), after, ajs)

    const flushed = await eq.dispatch(
      new TestCtx({
        type: 'track',
      })
    )

    const messages = flushed
      .logs()
      .map((l) => ({ message: l.message, extras: l.extras }))
    expect(messages).toMatchInlineSnapshot(`
      [
        {
          "extras": undefined,
          "message": "Dispatching",
        },
        {
          "extras": {
            "plugin": "after-failed",
          },
          "message": "plugin",
        },
        {
          "extras": {
            "plugin": "after",
          },
          "message": "plugin",
        },
        {
          "extras": {
            "error": [Error: Boom!],
            "plugin": "after-failed",
          },
          "message": "plugin Error",
        },
        {
          "extras": {
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
      TestCtx.system(),
      {
        ...testPlugin,
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
      TestCtx.system(),
      {
        ...testPlugin,
        name: 'Watermelon',
        type: 'enrichment',
        track: async (ctx) => {
          ctx.updateEvent('properties.watermelon', '🍉')
          return ctx
        },
      },
      ajs
    )
    let trackCalled = false
    await eq.register(
      TestCtx.system(),
      {
        ...testPlugin,
        name: 'Before',
        type: 'before',
        track: async (ctx) => {
          trackCalled = true
          return ctx
        },
      },
      ajs
    )

    const flushed = await eq.dispatch(
      new TestCtx({
        type: 'track',
      })
    )

    expect(flushed.event.properties).toEqual({
      watermelon: '🍉',
      kiwi: '🥝',
    })

    expect(trackCalled).toBeTruthy()
  })

  test('respects execution order', async () => {
    const eq = new EventQueue()

    let trace = 0

    const before: Plugin = {
      ...testPlugin,
      name: 'Before',
      type: 'before',
      track: async (ctx) => {
        trace++
        expect(trace).toBe(1)
        return ctx
      },
    }

    const enrichment: Plugin = {
      ...testPlugin,
      name: 'Enrichment',
      type: 'enrichment',
      track: async (ctx) => {
        trace++
        expect(trace === 2 || trace === 3).toBe(true)
        return ctx
      },
    }

    const enrichmentTwo: Plugin = {
      ...testPlugin,
      name: 'Enrichment 2',
      type: 'enrichment',
      track: async (ctx) => {
        trace++
        expect(trace === 2 || trace === 3).toBe(true)
        return ctx
      },
    }

    const destination: Plugin = {
      ...testPlugin,
      name: 'Destination',
      type: 'destination',
      track: async (ctx) => {
        trace++
        expect(trace).toBe(4)
        return ctx
      },
    }

    // shuffle plugins so we can verify order
    const plugins = shuffle([before, enrichment, enrichmentTwo, destination])
    for (const xt of plugins) {
      await eq.register(TestCtx.system(), xt, ajs)
    }

    await eq.dispatch(
      new TestCtx({
        type: 'track',
      })
    )

    expect(trace).toBe(4)
  })
})
