import { Context } from '@/core/context'
import { Extension } from '@/core/extension'
import { JSDOM } from 'jsdom'
import { AnalyticsBrowser } from '../browser'
import { Group } from '../core/user'
import { LegacyDestination } from '../extensions/ajs-destination'
import { Analytics } from '../analytics'

const sleep = (time: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, time)
  })

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
  group: async (ctx) => ctx,
  alias: async (ctx) => ctx,
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
    ctx.event.properties = {
      ...ctx.event.properties,
      billingPlan: 'free-99',
    }
    return ctx
  },
}

const writeKey = '***REMOVED***'

describe('Initialization', () => {
  beforeEach(async () => {
    jest.resetAllMocks()
  })

  it('loads extensions', async () => {
    await AnalyticsBrowser.load({
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
    await AnalyticsBrowser.load({ writeKey, extensions: [lazyExtension] })

    expect(lazyExtension.load).toHaveBeenCalled()
    expect(onLoad).not.toHaveBeenCalled()
    expect(extensionLoaded).toBe(false)

    await sleep(300)

    expect(onLoad).toHaveBeenCalled()
    expect(extensionLoaded).toBe(true)
  })

  it('ready method is called only when all extensions with ready have declared themselves as ready', async () => {
    const ready = jest.fn()

    const lazyExtension1: Extension = {
      name: 'Test 2',
      type: 'destination',
      version: '1.0',

      load: async (_ctx) => {},
      ready: async () => {
        return new Promise((resolve) => setTimeout(resolve, 300))
      },
      isLoaded: () => true,
    }

    const lazyExtension2: Extension = {
      name: 'Test 2',
      type: 'destination',
      version: '1.0',

      load: async (_ctx) => {},
      ready: async () => {
        return new Promise((resolve) => setTimeout(resolve, 100))
      },
      isLoaded: () => true,
    }

    jest.spyOn(lazyExtension1, 'load')
    jest.spyOn(lazyExtension2, 'load')
    const [analytics] = await AnalyticsBrowser.load({ writeKey, extensions: [lazyExtension1, lazyExtension2, xt] })

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    analytics.ready(ready)
    expect(lazyExtension1.load).toHaveBeenCalled()
    expect(lazyExtension2.load).toHaveBeenCalled()
    expect(ready).not.toHaveBeenCalled()

    await sleep(100)
    expect(ready).not.toHaveBeenCalled()

    await sleep(200)
    expect(ready).toHaveBeenCalled()
  })

  it('should call page if initialpageview is set', async () => {
    jest.mock('../analytics')
    const mockPage = jest.fn()
    Analytics.prototype.page = mockPage
    await AnalyticsBrowser.load({ writeKey }, { initialPageview: true })
    expect(mockPage).toHaveBeenCalled()
  })

  it('shouldnt call page if initialpageview is not set', async () => {
    jest.mock('../analytics')
    const mockPage = jest.fn()
    Analytics.prototype.page = mockPage
    await AnalyticsBrowser.load({ writeKey }, { initialPageview: false })
    expect(mockPage).not.toHaveBeenCalled()
  })
})

describe('Dispatch', () => {
  it('dispatches events', async () => {
    const [ajs] = await AnalyticsBrowser.load({
      writeKey,
    })

    ajs
      .track('Boo!', {
        total: 25,
      })
      .catch(console.error)

    const dispatchQueue = ajs.queue.queue
    expect(dispatchQueue.length).toBe(1)

    await ajs.queue.flush()
    expect(dispatchQueue.length).toBe(0)
  })

  it('dispatches events to destinations', async () => {
    const [ajs] = await AnalyticsBrowser.load({
      writeKey,
      extensions: [amplitude, googleAnalytics],
    })

    const ampSpy = jest.spyOn(amplitude, 'track')
    const gaSpy = jest.spyOn(googleAnalytics, 'track')

    const boo = await ajs.track('Boo!', {
      total: 25,
      userId: '👻',
    })

    expect(ampSpy).toHaveBeenCalledWith(boo)
    expect(gaSpy).toHaveBeenCalledWith(boo)
  })

  it('enriches events before dispatching', async () => {
    const [ajs] = await AnalyticsBrowser.load({
      writeKey,
      extensions: [enrichBilling, amplitude, googleAnalytics],
    })

    const boo = await ajs.track('Boo!', {
      total: 25,
    })

    expect(boo.event.properties).toMatchInlineSnapshot(`
      Object {
        "billingPlan": "free-99",
        "total": 25,
      }
    `)
  })

  it('collects metrics for every event', async () => {
    const [ajs] = await AnalyticsBrowser.load({
      writeKey,
      extensions: [amplitude],
    })

    const delivered = await ajs.track('Fruit Basket', {
      items: ['🍌', '🍇', '🍎'],
      userId: 'Healthy person',
    })

    const metrics = delivered.stats.metrics

    expect(metrics.map((m) => m.metric)).toMatchInlineSnapshot(`
      Array [
        "message_dispatched",
        "extension_time",
        "extension_time",
        "extension_time",
        "message_delivered",
        "delivered",
      ]
    `)
  })
})

describe('Group', () => {
  it('manages Group state', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })

    const group = analytics.group() as Group

    const ctx = (await analytics.group('coolKids', {
      coolKids: true,
    })) as Context

    expect(ctx.event.groupId).toEqual('coolKids')
    expect(ctx.event.traits).toEqual({ coolKids: true })

    expect(group.id()).toEqual('coolKids')
    expect(group.traits()).toEqual({ coolKids: true })
  })
})

describe('Alias', () => {
  it('generates alias events', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
      extensions: [amplitude],
    })

    jest.spyOn(amplitude, 'alias')

    const ctx = await analytics.alias('netto farah', 'netto')

    expect(ctx.event.userId).toEqual('netto farah')
    expect(ctx.event.previousId).toEqual('netto')

    expect(amplitude.alias).toHaveBeenCalled()
  })
})

describe('setAnonymousId', () => {
  it('calling setAnonymousId will set a new anonymousId and returns it', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
      extensions: [amplitude],
    })

    const currentAnonymousId = analytics.user().anonymousId()
    expect(currentAnonymousId).toBeDefined()
    expect(currentAnonymousId).toHaveLength(36)

    const newAnonymousId = analytics.setAnonymousId('🦹‍♀️')

    expect(analytics.user().anonymousId()).toEqual('🦹‍♀️')
    expect(newAnonymousId).toEqual('🦹‍♀️')
  })
})

describe('addSourceMiddleware', () => {
  it('supports registering source middlewares', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })

    await analytics.addSourceMiddleware(({ next, payload }) => {
      payload.obj.context = {
        hello: 'from the other side',
      }
      next(payload)
    })

    const ctx = await analytics.track('Hello!')

    expect(ctx.event.context).toEqual({
      hello: 'from the other side',
    })
  })
})

describe('addDestinationMiddleware', () => {
  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.resetAllMocks()

    const html = `
    <!DOCTYPE html>
      <head>
        <script>'hi'</script>
      </head>
      <body>
      </body>
    </html>
    `.trim()

    const jsd = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'https://localhost' })

    const windowSpy = jest.spyOn(global, 'window', 'get')
    windowSpy.mockImplementation(() => (jsd.window as unknown) as Window & typeof globalThis)
  })

  it('supports registering destination middlewares', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })

    const amplitude = new LegacyDestination(
      'amplitude',
      'latest',
      {
        apiKey: '***REMOVED***',
      },
      {}
    )

    await analytics.register(amplitude)
    await amplitude.ready()

    await analytics.addDestinationMiddleware('amplitude', ({ next, payload }) => {
      payload.obj.properties!.hello = 'from the other side'
      next(payload)
    })

    const integrationMock = jest.spyOn(amplitude.integration!, 'track')

    const ctx = await analytics.track('Hello!')

    // does not modify the event
    expect(ctx.event.properties).not.toEqual({
      hello: 'from the other side',
    })

    const calledWith = integrationMock.mock.calls[0][0].properties()

    // only impacted this destination
    expect(calledWith).toEqual({
      ...ctx.event.properties,
      hello: 'from the other side',
    })
  })
})
