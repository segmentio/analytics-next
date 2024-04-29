/* eslint-disable @typescript-eslint/no-floating-promises */
import { cdnSettingsKitchenSink } from '../../test-helpers/fixtures/cdn-settings'
import { createMockFetchImplementation } from '../../test-helpers/fixtures/create-fetch-method'
import { Context } from '../../core/context'
import { Plugin } from '../../core/plugin'
import { JSDOM } from 'jsdom'
import { Analytics, InitOptions } from '../../core/analytics'
import { LegacyDestination } from '../../plugins/ajs-destination'
import { PersistedPriorityQueue } from '../../lib/priority-queue/persisted'
// @ts-ignore loadLegacySettings mocked dependency is accused as unused
import { AnalyticsBrowser, loadLegacySettings } from '..'
// @ts-ignore isOffline mocked dependency is accused as unused
import { isOffline } from '../../core/connection'
import * as SegmentPlugin from '../../plugins/segmentio'
import jar from 'js-cookie'
import { PriorityQueue } from '../../lib/priority-queue'
import { getCDN, setGlobalCDNUrl } from '../../lib/parse-cdn'
import { clearAjsBrowserStorage } from '../../test-helpers/browser-storage'
import { parseFetchCall } from '../../test-helpers/fetch-parse'
import { ActionDestination } from '../../plugins/remote-loader'
import { UADataValues } from '../../lib/client-hints/interfaces'
import {
  highEntropyTestData,
  lowEntropyTestData,
} from '../../test-helpers/fixtures/client-hints'
import { getGlobalAnalytics, NullAnalytics } from '../..'
import { recordIntegrationMetric } from '../../core/stats/metric-helpers'

let fetchCalls: ReturnType<typeof parseFetchCall>[] = []

jest.mock('unfetch', () => {
  return {
    __esModule: true,
    default: (url: RequestInfo, body?: RequestInit) => {
      const call = parseFetchCall([url, body])
      fetchCalls.push(call)
      return createMockFetchImplementation(cdnSettingsKitchenSink)(url, body)
    },
  }
})

const sleep = (time: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, time)
  })

const xt: Plugin = {
  name: 'Test Plugin',
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

const amplitude: Plugin = {
  ...xt,
  name: 'Amplitude',
  type: 'destination',
}

const googleAnalytics: Plugin = {
  ...xt,
  name: 'Google Analytics',
  type: 'destination',
}

const slowPlugin: Plugin = {
  ...xt,
  name: 'Slow Plugin',
  type: 'destination',
  track: async (ctx) => {
    await sleep(3000)
    return ctx
  },
}

const enrichBilling: Plugin = {
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

const writeKey = 'foo'
const amplitudeWriteKey = 'bar'

beforeEach(() => {
  setGlobalCDNUrl(undefined as any)
  fetchCalls = []
})

describe('Initialization', () => {
  beforeEach(async () => {
    jest.resetAllMocks()
    jest.resetModules()
  })

  it('loads plugins', async () => {
    await AnalyticsBrowser.load({
      writeKey,
      plugins: [xt],
    })

    expect(xt.isLoaded()).toBe(true)
  })

  it('loads async plugins', async () => {
    let pluginLoaded = false
    const onLoad = jest.fn(() => {
      pluginLoaded = true
    })

    const lazyPlugin: Plugin = {
      name: 'Test 2',
      type: 'utility',
      version: '1.0',

      load: async (_ctx) => {
        setTimeout(onLoad, 300)
      },
      isLoaded: () => {
        return pluginLoaded
      },
    }

    jest.spyOn(lazyPlugin, 'load')
    await AnalyticsBrowser.load({ writeKey, plugins: [lazyPlugin] })

    expect(lazyPlugin.load).toHaveBeenCalled()
    expect(onLoad).not.toHaveBeenCalled()
    expect(pluginLoaded).toBe(false)

    await sleep(300)

    expect(onLoad).toHaveBeenCalled()
    expect(pluginLoaded).toBe(true)
  })

  it('ready method is called only when all plugins with ready have declared themselves as ready', async () => {
    const ready = jest.fn()

    const lazyPlugin1: Plugin = {
      name: 'Test 2',
      type: 'destination',
      version: '1.0',

      load: async (_ctx) => {},
      ready: async () => {
        return new Promise((resolve) => setTimeout(resolve, 300))
      },
      isLoaded: () => true,
    }

    const lazyPlugin2: Plugin = {
      name: 'Test 2',
      type: 'destination',
      version: '1.0',

      load: async (_ctx) => {},
      ready: async () => {
        return new Promise((resolve) => setTimeout(resolve, 100))
      },
      isLoaded: () => true,
    }

    jest.spyOn(lazyPlugin1, 'load')
    jest.spyOn(lazyPlugin2, 'load')
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
      plugins: [lazyPlugin1, lazyPlugin2, xt],
    })

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    analytics.ready(ready)
    expect(lazyPlugin1.load).toHaveBeenCalled()
    expect(lazyPlugin2.load).toHaveBeenCalled()
    expect(ready).not.toHaveBeenCalled()

    await sleep(100)
    expect(ready).not.toHaveBeenCalled()

    await sleep(200)
    expect(ready).toHaveBeenCalled()
  })

  describe('cdn', () => {
    it('should get the correct CDN in plugins if the CDN overridden', async () => {
      const overriddenCDNUrl = 'http://cdn.segment.com' // http instead of https
      await AnalyticsBrowser.load({
        cdnURL: overriddenCDNUrl,
        writeKey,
        plugins: [
          {
            ...xt,
            load: async () => {
              expect(getGlobalAnalytics()).toBeUndefined()
              expect(getCDN()).toContain(overriddenCDNUrl)
            },
          },
        ],
      })

      expect(fetchCalls[0].url).toContain(overriddenCDNUrl)
      expect.assertions(3)
    })
  })

  describe('globalAnalyticsKey', () => {
    const overrideKey = 'myKey'
    const buffer = {
      foo: 'bar',
    }

    beforeEach(() => {
      ;(window as any)[overrideKey] = buffer
    })
    afterEach(() => {
      delete (window as any)[overrideKey]
    })
    it('should default to window.analytics', async () => {
      const defaultObj = { original: 'default' }
      ;(window as any)['analytics'] = defaultObj

      await AnalyticsBrowser.load({
        writeKey,
        plugins: [
          {
            ...xt,
            load: async () => {
              expect(getGlobalAnalytics()).toBe(defaultObj)
            },
          },
        ],
      })
      expect.assertions(1)
    })

    it('should set the global window key for the analytics buffer with the setting option', async () => {
      await AnalyticsBrowser.load(
        {
          writeKey,
          plugins: [
            {
              ...xt,
              load: async () => {
                expect(getGlobalAnalytics()).toBe(buffer)
              },
            },
          ],
        },
        {
          globalAnalyticsKey: overrideKey,
        }
      )
      expect.assertions(1)
    })
  })

  describe('Load options', () => {
    it('gets high entropy client hints if set', async () => {
      ;(window.navigator as any).userAgentData = {
        ...lowEntropyTestData,
        getHighEntropyValues: jest
          .fn()
          .mockImplementation((hints: string[]): Promise<UADataValues> => {
            let result = {}
            Object.entries(highEntropyTestData).forEach(([k, v]) => {
              if (hints.includes(k)) {
                result = {
                  ...result,
                  [k]: v,
                }
              }
            })
            return Promise.resolve({
              ...lowEntropyTestData,
              ...result,
            })
          }),
        toJSON: jest.fn(() => lowEntropyTestData),
      }

      const [ajs] = await AnalyticsBrowser.load(
        { writeKey },
        { highEntropyValuesClientHints: ['architecture'] }
      )

      const evt = await ajs.track('foo')
      expect(evt.event.context?.userAgentData).toEqual({
        ...lowEntropyTestData,
        architecture: 'x86',
      })
    })
    it('calls page if initialpageview is set', async () => {
      const page = jest.spyOn(Analytics.prototype, 'page')
      await AnalyticsBrowser.load({ writeKey }, { initialPageview: true })
      await sleep(0) // flushed in new task
      expect(page).toHaveBeenCalledTimes(1)
    })

    it('does not call page if initialpageview is not set', async () => {
      const page = jest.spyOn(Analytics.prototype, 'page')
      await AnalyticsBrowser.load({ writeKey }, { initialPageview: false })
      await sleep(0) // flush happens async
      expect(page).not.toHaveBeenCalled()
    })

    it('does not use a persisted queue when disableClientPersistence is true', async () => {
      const [ajs] = await AnalyticsBrowser.load(
        {
          writeKey,
        },
        {
          disableClientPersistence: true,
        }
      )

      expect(ajs.queue.queue instanceof PriorityQueue).toBe(true)
      expect(ajs.queue.queue instanceof PersistedPriorityQueue).toBe(false)
    })

    it('uses a persisted queue by default', async () => {
      const [ajs] = await AnalyticsBrowser.load({
        writeKey,
      })

      expect(ajs.queue.queue instanceof PersistedPriorityQueue).toBe(true)
    })

    it('disables identity persistance when disableClientPersistence is true', async () => {
      const [ajs] = await AnalyticsBrowser.load(
        {
          writeKey,
        },
        {
          disableClientPersistence: true,
        }
      )

      expect(ajs.user().options.persist).toBe(false)
      expect(ajs.group().options.persist).toBe(false)
    })

    it('fetch remote source settings by default', async () => {
      await AnalyticsBrowser.load({
        writeKey,
      })

      expect(fetchCalls.length).toBeGreaterThan(0)
      expect(fetchCalls[0].url).toMatch(/\/settings$/)
    })

    it('does not fetch source settings if cdnSettings is set', async () => {
      await AnalyticsBrowser.load({
        writeKey,
        cdnSettings: { integrations: {} },
      })

      expect(fetchCalls.length).toBe(0)
    })
  })

  describe('options.integrations permutations', () => {
    const settings = { writeKey }

    it('does not load Segment.io if integrations.All is false and Segment.io is not listed', async () => {
      const options: { integrations: { [key: string]: boolean } } = {
        integrations: { All: false },
      }
      const analyticsResponse = await AnalyticsBrowser.load(settings, options)

      const segmentio = analyticsResponse[0].queue.plugins.find(
        (p) => p.name === 'Segment.io'
      )

      expect(segmentio).toBeUndefined()
    })

    it('does not load Segment.io if its set to false', async () => {
      const options: { integrations?: { [key: string]: boolean } } = {
        integrations: { 'Segment.io': false },
      }
      const analyticsResponse = await AnalyticsBrowser.load(settings, options)

      const segmentio = analyticsResponse[0].queue.plugins.find(
        (p) => p.name === 'Segment.io'
      )

      expect(segmentio).toBeUndefined()
    })

    it('loads Segment.io if integrations.All is false and Segment.io is listed', async () => {
      const options: { integrations: { [key: string]: boolean } } = {
        integrations: { All: false, 'Segment.io': true },
      }
      const analyticsResponse = await AnalyticsBrowser.load(settings, options)

      const segmentio = analyticsResponse[0].queue.plugins.find(
        (p) => p.name === 'Segment.io'
      )

      expect(segmentio).toBeDefined()
    })

    it('loads Segment.io if integrations.All is undefined', async () => {
      const options: { integrations: { [key: string]: boolean } } = {
        integrations: { 'Segment.io': true },
      }
      const analyticsResponse = await AnalyticsBrowser.load(settings, options)

      const segmentio = analyticsResponse[0].queue.plugins.find(
        (p) => p.name === 'Segment.io'
      )

      expect(segmentio).toBeDefined()
    })

    it('loads Segment.io if integrations is undefined', async () => {
      const options: { integrations?: { [key: string]: boolean } } = {
        integrations: undefined,
      }
      const analyticsResponse = await AnalyticsBrowser.load(settings, options)

      const segmentio = analyticsResponse[0].queue.plugins.find(
        (p) => p.name === 'Segment.io'
      )

      expect(segmentio).toBeDefined()
    })

    it('loads selected plugins when Segment.io is false', async () => {
      const options: { integrations?: { [key: string]: boolean } } = {
        integrations: {
          'Test Plugin': true,
          'Segment.io': false,
        },
      }
      const analyticsResponse = await AnalyticsBrowser.load(
        { ...settings, plugins: [xt] },
        options
      )

      const plugin = analyticsResponse[0].queue.plugins.find(
        (p) => p.name === 'Test Plugin'
      )

      const segmentio = analyticsResponse[0].queue.plugins.find(
        (p) => p.name === 'Segment.io'
      )

      expect(plugin).toBeDefined()
      expect(segmentio).toBeUndefined()
    })

    it('loads selected plugins when Segment.io and All are false', async () => {
      const options: { integrations?: { [key: string]: boolean } } = {
        integrations: {
          All: false,
          'Test Plugin': true,
          'Segment.io': false,
        },
      }
      const analyticsResponse = await AnalyticsBrowser.load(
        { ...settings, plugins: [xt] },
        options
      )

      const plugin = analyticsResponse[0].queue.plugins.find(
        (p) => p.name === 'Test Plugin'
      )

      const segmentio = analyticsResponse[0].queue.plugins.find(
        (p) => p.name === 'Segment.io'
      )

      expect(plugin).toBeDefined()
      expect(segmentio).toBeUndefined()
    })
  })
})

describe('Dispatch', () => {
  it('dispatches events to destinations', async () => {
    const [ajs] = await AnalyticsBrowser.load({
      writeKey,
      plugins: [amplitude, googleAnalytics],
    })

    const segmentio = ajs.queue.plugins.find((p) => p.name === 'Segment.io')
    expect(segmentio).toBeDefined()

    const ampSpy = jest.spyOn(amplitude, 'track')
    const gaSpy = jest.spyOn(googleAnalytics, 'track')
    const segmentSpy = jest.spyOn(segmentio!, 'track')

    const boo = await ajs.track('Boo!', {
      total: 25,
      userId: '👻',
    })

    expect(ampSpy).toHaveBeenCalledWith(boo)
    expect(gaSpy).toHaveBeenCalledWith(boo)
    expect(segmentSpy).toHaveBeenCalledWith(boo)
  })

  it('does not dispatch events to destinations on deny list', async () => {
    const [ajs] = await AnalyticsBrowser.load({
      writeKey,
      plugins: [amplitude, googleAnalytics],
    })

    const segmentio = ajs.queue.plugins.find((p) => p.name === 'Segment.io')
    expect(segmentio).toBeDefined()

    const ampSpy = jest.spyOn(amplitude, 'track')
    const gaSpy = jest.spyOn(googleAnalytics, 'track')
    const segmentSpy = jest.spyOn(segmentio!, 'track')

    const boo = await ajs.track(
      'Boo!',
      {
        total: 25,
        userId: '👻',
      },
      {
        integrations: {
          Amplitude: false,
          'Segment.io': false,
        },
      }
    )

    expect(gaSpy).toHaveBeenCalledWith(boo)
    expect(ampSpy).not.toHaveBeenCalled()
    expect(segmentSpy).not.toHaveBeenCalled()
  })

  it('does dispatch events to Segment.io when All is false', async () => {
    const [ajs] = await AnalyticsBrowser.load({
      writeKey,
      plugins: [amplitude, googleAnalytics],
    })

    const segmentio = ajs.queue.plugins.find((p) => p.name === 'Segment.io')
    expect(segmentio).toBeDefined()

    const ampSpy = jest.spyOn(amplitude, 'track')
    const gaSpy = jest.spyOn(googleAnalytics, 'track')
    const segmentSpy = jest.spyOn(segmentio!, 'track')

    const boo = await ajs.track(
      'Boo!',
      {
        total: 25,
        userId: '👻',
      },
      {
        integrations: {
          All: false,
        },
      }
    )

    expect(gaSpy).not.toHaveBeenCalled()
    expect(ampSpy).not.toHaveBeenCalled()
    expect(segmentSpy).toHaveBeenCalledWith(boo)
  })

  it('dispatching to Segmentio not blocked by other destinations', async () => {
    const [ajs] = await AnalyticsBrowser.load({
      writeKey,
      plugins: [slowPlugin],
    })

    const segmentio = ajs.queue.plugins.find((p) => p.name === 'Segment.io')
    const segmentSpy = jest.spyOn(segmentio!, 'track')

    await Promise.race([
      ajs.track(
        'Boo!',
        {
          total: 25,
          userId: '👻',
        },
        {
          integrations: {
            All: true,
          },
        }
      ),
      sleep(100),
    ])

    expect(segmentSpy).toHaveBeenCalled()
  })

  it('enriches events before dispatching', async () => {
    const [ajs] = await AnalyticsBrowser.load({
      writeKey,
      plugins: [enrichBilling, amplitude, googleAnalytics],
    })

    const boo = await ajs.track('Boo!', {
      total: 25,
    })

    expect(boo.event.properties).toMatchInlineSnapshot(`
      {
        "billingPlan": "free-99",
        "total": 25,
      }
    `)
  })

  it('collects metrics for every event', async () => {
    const [ajs] = await AnalyticsBrowser.load({
      writeKey,
      plugins: [amplitude],
    })

    const delivered = await ajs.track('Fruit Basket', {
      items: ['🍌', '🍇', '🍎'],
      userId: 'Healthy person',
    })

    const metrics = delivered.stats.metrics

    expect(metrics.map((m) => m.metric)).toMatchInlineSnapshot(`
      [
        "message_dispatched",
        "plugin_time",
        "plugin_time",
        "plugin_time",
        "message_delivered",
        "delivered",
      ]
    `)
  })

  it('respects api and protocol overrides for metrics endpoint', async () => {
    const [ajs] = await AnalyticsBrowser.load(
      {
        writeKey,
        cdnSettings: {
          integrations: {
            'Segment.io': {
              apiHost: 'cdnSettings.api.io',
            },
          },
          metrics: {
            flushTimer: 0,
          },
        },
      },
      {
        integrations: {
          'Segment.io': {
            apiHost: 'new.api.io',
            protocol: 'http',
          },
        },
      }
    )

    const event = await ajs.track('foo')

    recordIntegrationMetric(event, {
      integrationName: 'foo',
      methodName: 'bar',
      type: 'action',
    })

    await sleep(10)
    expect(fetchCalls[1].url).toBe('http://new.api.io/m')
  })
})

describe('Group', () => {
  it('manages Group state', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })

    const group = analytics.group()

    const ctx = await analytics.group('coolKids', {
      coolKids: true,
    })

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
      plugins: [amplitude],
    })

    jest.spyOn(amplitude, 'alias')

    const ctx = await analytics.alias('netto farah', 'netto')

    expect(ctx.event.userId).toEqual('netto farah')
    expect(ctx.event.previousId).toEqual('netto')

    expect(amplitude.alias).toHaveBeenCalled()
  })

  it('falls back to userID in cookies if no id passed', async () => {
    jar.set('ajs_user_id', 'dan')
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
      plugins: [amplitude],
    })

    jest.spyOn(amplitude, 'alias')

    // @ts-ignore ajs 1.0 parity - allows empty alias calls
    const ctx = await analytics.alias()

    expect(ctx.event.userId).toEqual('dan')
    expect(amplitude.alias).toHaveBeenCalled()
  })
})

describe('pageview', () => {
  it('makes a page call with the given url', async () => {
    console.warn = (): void => {}
    const analytics = new Analytics({ writeKey: writeKey })
    const mockPage = jest.spyOn(analytics, 'page')
    await analytics.pageview('www.foo.com')

    expect(mockPage).toHaveBeenCalledWith({ path: 'www.foo.com' })
  })
})

describe('setAnonymousId', () => {
  beforeEach(() => {
    clearAjsBrowserStorage()
  })

  it('calling setAnonymousId will set a new anonymousId and returns it', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
      plugins: [amplitude],
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

    await analytics
      .addSourceMiddleware(({ next, payload }) => {
        payload.obj.context = {
          hello: 'from the other side',
        }
        next(payload)
      })
      .catch((err) => {
        throw err
      })

    const ctx = await analytics.track('Hello!')

    expect(ctx.event.context).toMatchObject({
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

    const jsd = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'https://localhost',
    })

    const windowSpy = jest.spyOn(global, 'window', 'get')
    windowSpy.mockImplementation(
      () => jsd.window as unknown as Window & typeof globalThis
    )
  })

  it('supports registering destination middlewares', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })

    const amplitude = new LegacyDestination(
      'amplitude',
      'latest',
      writeKey,
      {
        apiKey: amplitudeWriteKey,
      },
      {}
    )

    await analytics.register(amplitude)
    await amplitude.ready()

    analytics
      .addDestinationMiddleware('amplitude', ({ next, payload }) => {
        payload.obj.properties!.hello = 'from the other side'
        next(payload)
      })
      .catch((err) => {
        throw err
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

  it('drops events if  next is never called', async () => {
    const testPlugin: Plugin = {
      name: 'test',
      type: 'destination',
      version: '0.1.0',
      load: () => Promise.resolve(),
      track: jest.fn(),
      isLoaded: () => true,
    }

    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })

    const fullstory = new ActionDestination('fullstory', testPlugin)

    await analytics.register(fullstory)
    await fullstory.ready()
    analytics.addDestinationMiddleware('fullstory', () => {
      // do nothing
    })

    await analytics.track('foo')

    expect(testPlugin.track).not.toHaveBeenCalled()
  })

  it('drops events if next is called with null', async () => {
    const testPlugin: Plugin = {
      name: 'test',
      type: 'destination',
      version: '0.1.0',
      load: () => Promise.resolve(),
      track: jest.fn(),
      isLoaded: () => true,
    }

    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })

    const fullstory = new ActionDestination('fullstory', testPlugin)

    await analytics.register(fullstory)
    await fullstory.ready()
    analytics.addDestinationMiddleware('fullstory', ({ next }) => {
      next(null)
    })

    await analytics.track('foo')

    expect(testPlugin.track).not.toHaveBeenCalled()
  })

  it('applies to all destinations if * glob is passed as name argument', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })

    const p1 = new ActionDestination('p1', { ...googleAnalytics })
    const p2 = new ActionDestination('p2', { ...amplitude })

    await analytics.register(p1, p2)
    await p1.ready()
    await p2.ready()

    const middleware = jest.fn()

    analytics.addDestinationMiddleware('*', middleware)
    await analytics.track('foo')

    expect(middleware).toHaveBeenCalledTimes(2)
    expect(middleware).toHaveBeenCalledWith(
      expect.objectContaining({ integration: 'p1' })
    )
    expect(middleware).toHaveBeenCalledWith(
      expect.objectContaining({ integration: 'p2' })
    )
  })

  it('middleware is only applied to type: destination plugins', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })

    const utilityPlugin = new ActionDestination('p1', {
      ...xt,
      type: 'utility',
    })

    const destinationPlugin = new ActionDestination('p2', {
      ...xt,
      type: 'destination',
    })

    await analytics.register(utilityPlugin, destinationPlugin)
    await utilityPlugin.ready()
    await destinationPlugin.ready()

    const middleware = jest.fn()

    analytics.addDestinationMiddleware('*', middleware)
    await analytics.track('foo')

    expect(middleware).toHaveBeenCalledTimes(1)
    expect(middleware).toHaveBeenCalledWith(
      expect.objectContaining({ integration: 'p2' })
    )
  })

  it('supports registering action destination middlewares', async () => {
    const testPlugin: Plugin = {
      name: 'test',
      type: 'destination',
      version: '0.1.0',
      load: () => Promise.resolve(),
      isLoaded: () => true,
    }

    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })

    const fullstory = new ActionDestination('fullstory', testPlugin)

    await analytics.register(fullstory)
    await fullstory.ready()

    analytics
      .addDestinationMiddleware('fullstory', ({ next, payload }) =>
        next(payload)
      )
      .catch((err) => {
        throw err
      })

    expect(analytics.queue.plugins).toContain(fullstory)
  })
})

describe('use', () => {
  it('registers a legacyPlugin', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })

    const legacyPlugin = jest.fn()
    analytics.use(legacyPlugin)

    expect(legacyPlugin).toHaveBeenCalledWith(analytics)
  })
})

describe('timeout', () => {
  it('has a default timeout value', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })
    //@ts-ignore
    expect(analytics.settings.timeout).toEqual(300)
  })

  it('can set a timeout value', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })
    analytics.timeout(50)
    //@ts-ignore
    expect(analytics.settings.timeout).toEqual(50)
  })
})
describe('register', () => {
  it('will not invoke any plugins that have initialization errors', async () => {
    const analytics = AnalyticsBrowser.load({
      writeKey,
    })

    const errorPlugin = new ActionDestination('Error Plugin', {
      ...googleAnalytics,
      load: () => Promise.reject('foo'),
    })
    const errorPluginSpy = jest.spyOn(errorPlugin, 'track')

    const goodPlugin = new ActionDestination('Good Plugin', {
      ...googleAnalytics,
      load: () => Promise.resolve('foo'),
    })
    const goodPluginSpy = jest.spyOn(goodPlugin, 'track')

    await analytics.register(goodPlugin, errorPlugin)
    await errorPlugin.ready()
    await goodPlugin.ready()

    await analytics.track('foo')

    expect(errorPluginSpy).not.toHaveBeenCalled()
    expect(goodPluginSpy).toHaveBeenCalled()
  })

  it('will emit initialization errors', async () => {
    const analytics = AnalyticsBrowser.load({
      writeKey,
    })

    const errorPlugin = new ActionDestination('Error Plugin', {
      ...googleAnalytics,
      load: () => Promise.reject('foo'),
    })

    const goodPlugin = new ActionDestination('Good Plugin', {
      ...googleAnalytics,
      load: () => Promise.resolve('foo'),
    })

    await analytics
    const errorPluginName = new Promise<string>((resolve) => {
      analytics.instance?.queue.on('initialization_failure', (plugin) =>
        resolve(plugin.name)
      )
    })

    await analytics.register(goodPlugin, errorPlugin)
    await errorPlugin.ready()
    await goodPlugin.ready()

    expect(await errorPluginName).toBe('Error Plugin')
  })
})

describe('deregister', () => {
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

    const jsd = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'https://localhost',
    })

    const windowSpy = jest.spyOn(global, 'window', 'get')
    windowSpy.mockImplementation(
      () => jsd.window as unknown as Window & typeof globalThis
    )
  })

  it('deregisters a plugin given its name', async () => {
    const unload = jest.fn((): Promise<unknown> => {
      return Promise.resolve()
    })
    xt.unload = unload

    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
      plugins: [xt],
    })

    await analytics.deregister('Test Plugin')
    expect(xt.unload).toHaveBeenCalled()
  })

  it('cleans up the DOM when deregistering a legacy integration', async () => {
    const amplitude = new LegacyDestination(
      'amplitude',
      'latest',
      writeKey,
      {
        apiKey: amplitudeWriteKey,
      },
      {}
    )

    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
      plugins: [amplitude],
    })

    await analytics.ready()

    const scriptsLength = window.document.scripts.length
    expect(scriptsLength).toBeGreaterThan(1)

    await analytics.deregister('amplitude')
    expect(window.document.scripts.length).toBe(scriptsLength - 1)
  })
})

describe('retries', () => {
  const testPlugin: Plugin = {
    name: 'test',
    type: 'before',
    version: '0.1.0',
    load: () => Promise.resolve(),
    isLoaded: () => true,
  }

  const fruitBasketEvent = new Context({
    type: 'track',
    event: 'Fruit Basket',
  })

  beforeEach(async () => {
    // @ts-ignore ignore reassining function
    loadLegacySettings = jest.fn().mockReturnValue(
      Promise.resolve({
        integrations: { 'Segment.io': { retryQueue: false } },
      })
    )
  })

  it('does not retry errored events if retryQueue setting is set to false', async () => {
    const [ajs] = await AnalyticsBrowser.load(
      { writeKey: writeKey },
      { retryQueue: false }
    )

    expect(ajs.queue.queue instanceof PersistedPriorityQueue).toBeTruthy()
    expect(ajs.queue.queue.maxAttempts).toBe(1)

    await ajs.queue.register(
      Context.system(),
      {
        ...testPlugin,
        track: (_ctx) => {
          throw new Error('aaay')
        },
      },
      ajs
    )

    // Dispatching an event will push it into the priority queue.
    await ajs.queue.dispatch(fruitBasketEvent).catch(() => {})

    // we make sure the queue is flushed and there are no events queued up.
    expect(ajs.queue.queue.length).toBe(0)
    const flushed = await ajs.queue.flush()
    expect(flushed).toStrictEqual([])

    // as maxAttempts === 1, only one attempt was made.
    // getAttempts(fruitBasketEvent) === 2 means the event's attemp was incremented,
    // but the condition "(getAttempts(event) > maxAttempts) { return false }"
    // aborted the retry
    expect(ajs.queue.queue.getAttempts(fruitBasketEvent)).toEqual(2)
  })

  it('does not queue events / dispatch when offline if retryQueue setting is set to false', async () => {
    const [ajs] = await AnalyticsBrowser.load(
      { writeKey },
      { retryQueue: false }
    )

    const trackSpy = jest.fn().mockImplementation((ctx) => ctx)
    await ajs.queue.register(
      Context.system(),
      {
        ...testPlugin,
        ready: () => Promise.resolve(true),
        track: trackSpy,
      },
      ajs
    )

    // @ts-ignore ignore reassining function
    isOffline = jest.fn().mockReturnValue(true)

    await ajs.track('event')

    expect(trackSpy).toBeCalledTimes(0)
  })

  it('enqueues events / dispatches if the client is currently offline and retries are *enabled* for the main event queue', async () => {
    const [ajs] = await AnalyticsBrowser.load(
      { writeKey },
      { retryQueue: true }
    )

    const trackSpy = jest.fn().mockImplementation((ctx) => ctx)
    await ajs.queue.register(
      Context.system(),
      {
        ...testPlugin,
        ready: () => Promise.resolve(true),
        track: trackSpy,
      },
      ajs
    )

    // @ts-ignore ignore reassining function
    isOffline = jest.fn().mockReturnValue(true)

    expect(trackSpy).toBeCalledTimes(0)

    await ajs.track('event')

    expect(trackSpy).toBeCalledTimes(1)
  })
})

describe('Segment.io overrides', () => {
  it('allows for overriding Segment.io settings', async () => {
    jest.spyOn(SegmentPlugin, 'segmentio')

    await AnalyticsBrowser.load(
      { writeKey },
      {
        integrations: {
          'Segment.io': {
            apiHost: 'https://my.endpoint.com',
            anotherSettings: '👻',
          },
        },
      }
    )

    expect(SegmentPlugin.segmentio).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        apiHost: 'https://my.endpoint.com',
        anotherSettings: '👻',
      }),
      expect.anything()
    )
  })
})

describe('Options', () => {
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

    const jsd = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'https://localhost',
    })

    const windowSpy = jest.spyOn(global, 'window', 'get')
    windowSpy.mockImplementation(
      () => jsd.window as unknown as Window & typeof globalThis
    )
  })

  describe('disableAutoISOConversion', () => {
    it('converts iso strings to dates be default', async () => {
      const [analytics] = await AnalyticsBrowser.load({
        writeKey,
      })

      const amplitude = new LegacyDestination(
        'amplitude',
        'latest',
        writeKey,
        {
          apiKey: amplitudeWriteKey,
        },
        {}
      )

      await analytics.register(amplitude)
      await amplitude.ready()

      const integrationMock = jest.spyOn(amplitude.integration!, 'track')
      await analytics.track('Hello!', {
        date: new Date(),
        iso: '2020-10-10',
      })

      const [integrationEvent] = integrationMock.mock.lastCall!

      expect(integrationEvent.properties()).toEqual({
        date: expect.any(Date),
        iso: expect.any(Date),
      })
      expect(integrationEvent.timestamp()).toBeInstanceOf(Date)
    })

    it('does not convert iso strings to dates be default if  disableAutoISOConversion is false', async () => {
      const initOptions: InitOptions = { disableAutoISOConversion: false }
      const [analytics] = await AnalyticsBrowser.load(
        {
          writeKey,
        },
        initOptions
      )

      const amplitude = new LegacyDestination(
        'amplitude',
        'latest',
        writeKey,
        {
          apiKey: amplitudeWriteKey,
        },
        initOptions
      )

      await analytics.register(amplitude)
      await amplitude.ready()

      const integrationMock = jest.spyOn(amplitude.integration!, 'track')
      await analytics.track('Hello!', {
        date: new Date(),
        iso: '2020-10-10',
      })

      const [integrationEvent] = integrationMock.mock.lastCall!

      expect(integrationEvent.properties()).toEqual({
        date: expect.any(Date),
        iso: expect.any(Date),
      })
      expect(integrationEvent.timestamp()).toBeInstanceOf(Date)
    })

    it('does not convert iso strings to dates when `true`', async () => {
      const initOptions: InitOptions = { disableAutoISOConversion: true }
      const [analytics] = await AnalyticsBrowser.load(
        {
          writeKey,
        },
        initOptions
      )

      const amplitude = new LegacyDestination(
        'amplitude',
        'latest',
        writeKey,
        {
          apiKey: amplitudeWriteKey,
        },
        initOptions
      )

      await analytics.register(amplitude)
      await amplitude.ready()

      const integrationMock = jest.spyOn(amplitude.integration!, 'track')
      await analytics.track('Hello!', {
        date: new Date(),
        iso: '2020-10-10',
      })

      const [integrationEvent] = integrationMock.mock.lastCall!

      expect(integrationEvent.properties()).toEqual({
        date: expect.any(Date),
        iso: '2020-10-10',
      })
      expect(integrationEvent.timestamp()).toBeInstanceOf(Date)
    })
  })

  describe('disable', () => {
    /**
     * Note: other tests in null-analytics.test.ts cover the NullAnalytics class (including persistence)
     */
    it('should return a null version of analytics / context', async () => {
      const [analytics, context] = await AnalyticsBrowser.load(
        {
          writeKey,
        },
        { disable: true }
      )
      expect(context).toBeInstanceOf(Context)
      expect(analytics).toBeInstanceOf(NullAnalytics)
      expect(analytics.initialized).toBe(true)
    })

    it('should not fetch cdn settings or dispatch events', async () => {
      const [analytics] = await AnalyticsBrowser.load(
        {
          writeKey,
        },
        { disable: true }
      )
      await analytics.track('foo')
      expect(fetchCalls.length).toBe(0)
    })

    it('should only accept a boolean value', async () => {
      const [analytics] = await AnalyticsBrowser.load(
        {
          writeKey,
        },
        // @ts-ignore
        { disable: 'true' }
      )
      expect(analytics).not.toBeInstanceOf(NullAnalytics)
    })

    it('should allow access to cdnSettings', async () => {
      const disableSpy = jest.fn().mockReturnValue(true)
      const [analytics] = await AnalyticsBrowser.load(
        {
          cdnSettings: { integrations: {}, foo: 123 },
          writeKey,
        },
        { disable: disableSpy }
      )
      expect(analytics).toBeInstanceOf(NullAnalytics)
      expect(disableSpy).toBeCalledWith({ integrations: {}, foo: 123 })
    })
  })
})
