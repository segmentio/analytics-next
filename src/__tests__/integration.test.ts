import { Analytics } from '@/core'
import { Context } from '@/core/context'
import { Extension } from '@/core/extension'

const xt: Extension = {
  name: 'Test Extension',
  type: 'utility',
  version: '1.0',

  load(_ctx: Context): Promise<void> {
    return Promise.resolve()
  },

  isLoaded(): boolean {
    return true
  },

  track: async (ctx) => ctx,
  identify: async (ctx) => ctx,
  page: async (ctx) => ctx,
}

const amplitude: Extension = {
  ...xt,
  name: 'Amplitude',
  type: 'destination',
}

const googleAnalytics: Extension = {
  ...xt,
  name: 'Google Analytics',
  type: 'destination',
}

const enrichBilling: Extension = {
  ...xt,
  name: 'Billing Enrichment',
  type: 'enrichment',

  track: async (ctx) => {
    ctx.updateEvent('properties.billingPlan', 'free-99')
    return ctx
  },
}

const writeKey = 'w_123'

beforeAll(() => {
  jest.useFakeTimers()
})

describe('Initialization', () => {
  it('loads extensions', async () => {
    await Analytics.load({
      writeKey,
      extensions: [xt],
    })

    expect(xt.isLoaded()).toBe(true)
  })

  it('loads async extensions', async () => {
    let extensionLoaded = false
    const onLoad = jest.fn(() => {
      extensionLoaded = true
    })

    const lazyExtension: Extension = {
      name: 'Test 2',
      type: 'utility',
      version: '1.0',

      load: async (_ctx) => {
        setTimeout(onLoad, 300)
      },
      isLoaded: () => {
        return extensionLoaded
      },
    }

    jest.spyOn(lazyExtension, 'load')
    await Analytics.load({ writeKey, extensions: [lazyExtension] })

    expect(lazyExtension.load).toHaveBeenCalled()
    expect(onLoad).not.toHaveBeenCalled()
    expect(extensionLoaded).toBe(false)

    jest.advanceTimersByTime(300)

    expect(onLoad).toHaveBeenCalled()
    expect(extensionLoaded).toBe(true)
  })
})

describe('Dispatch', () => {
  it('dispatches events', async () => {
    const ajs = await Analytics.load({
      writeKey,
      extensions: [],
    })

    await ajs.track('Boo!', {
      total: 25,
      userId: '👻',
    })

    const dispatchQueue = ajs.queue.queue
    expect(dispatchQueue.length).toBe(1)

    await ajs.queue.flush()
    expect(dispatchQueue.length).toBe(0)
  })

  it('dispatches events to destinations', async () => {
    const ajs = await Analytics.load({
      writeKey,
      extensions: [amplitude, googleAnalytics],
      deliverInline: true,
    })

    const ampSpy = jest.spyOn(amplitude, 'track')
    const gaSpy = jest.spyOn(googleAnalytics, 'track')

    const boo = await ajs.track('Boo!', {
      total: 25,
      userId: '👻',
    })

    await ajs.queue.flush()

    expect(ampSpy).toHaveBeenCalledWith(boo)
    expect(gaSpy).toHaveBeenCalledWith(boo)
  })

  it('enriches events before dispatching', async () => {
    const ajs = await Analytics.load({
      writeKey,
      extensions: [enrichBilling, amplitude, googleAnalytics],
      deliverInline: true,
    })

    const boo = await ajs.track('Boo!', {
      total: 25,
      userId: '👻',
    })

    expect(boo?.event).toMatchInlineSnapshot(`
      Object {
        "event": "Boo!",
        "properties": Object {
          "billingPlan": "free-99",
          "total": 25,
          "userId": "👻",
        },
        "type": "track",
      }
    `)
  })

  it('logs dispatch actions', async () => {
    const ajs = await Analytics.load({
      writeKey,
      extensions: [enrichBilling, amplitude, googleAnalytics],
    })

    await ajs.track('Yeehaw!', {
      total: 25,
      userId: '🤠',
    })

    await ajs.queue.flush()

    const delivered = ajs.queue.archive
    expect(delivered[0].logs()).toMatchInlineSnapshot(`
      Array [
        Object {
          "extras": Object {
            "time": 2020-09-16T17:58:27.945Z,
          },
          "level": "debug",
          "message": "Dispatching",
        },
        Object {
          "extras": Object {
            "extension": "Billing Enrichment",
            "time": 2020-09-16T17:58:27.945Z,
          },
          "level": "debug",
          "message": "extension",
        },
        Object {
          "extras": Object {
            "extension": "Amplitude",
            "time": 2020-09-16T17:58:27.945Z,
          },
          "level": "debug",
          "message": "extension",
        },
        Object {
          "extras": Object {
            "extension": "Google Analytics",
            "time": 2020-09-16T17:58:27.945Z,
          },
          "level": "debug",
          "message": "extension",
        },
        Object {
          "extras": Object {
            "time": 2020-09-16T17:58:27.945Z,
          },
          "level": "debug",
          "message": "Delivered",
        },
      ]
    `)
  })

  it('collects metrics for every event', async () => {
    const ajs = await Analytics.load({
      writeKey,
      extensions: [amplitude],
    })

    await ajs.track('Fruit Basket', {
      items: ['🍌', '🍇', '🍎'],
      userId: 'Healthy person',
    })

    await ajs.queue.flush()
    const metrics = ajs.queue.archive[0].stats.metrics

    expect(metrics).toMatchInlineSnapshot(`
      Array [
        Object {
          "metric": "message_dispatched",
          "tags": Array [],
          "type": "increment",
          "value": 1,
        },
        Object {
          "metric": "extension_time",
          "tags": Array [],
          "type": "gauge",
          "value": 0,
        },
        Object {
          "metric": "message_delivered",
          "tags": Array [],
          "type": "increment",
          "value": 1,
        },
        Object {
          "metric": "delivered",
          "tags": Array [],
          "type": "gauge",
          "value": 0,
        },
      ]
    `)
  })
})
