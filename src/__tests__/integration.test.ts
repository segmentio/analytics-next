import { Analytics } from '@/core'
import { Context } from '@/core/context'
import { Extension } from '@/core/extension'
import delay from 'delay'

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

const writeKey = 'w_123'

describe('Initialization', () => {
  it('loads extensions', () => {
    new Analytics({
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
    new Analytics({ writeKey, extensions: [lazyExtension] })

    expect(lazyExtension.load).toHaveBeenCalled()
    expect(onLoad).not.toHaveBeenCalled()
    expect(extensionLoaded).toBe(false)

    await delay(300)

    expect(onLoad).toHaveBeenCalled()
    expect(extensionLoaded).toBe(true)
  })
})

describe('Dispatch', () => {
  it('dispatches events', async () => {
    const ajs = new Analytics({
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
    const ajs = new Analytics({
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
    const enrichBilling: Extension = {
      ...xt,
      name: 'Billing Enrichment',
      type: 'enrichment',

      track: async (ctx) => {
        ctx.updateEvent('properties.billingPlan', 'free-99')
        return ctx
      },
    }

    const ajs = new Analytics({
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
})
