const fetcher = jest.fn()
jest.mock('node-fetch', () => fetcher)

import { AnalyticsNode } from '../index'
import { CorePlugin as Plugin } from '@segment/analytics-core'
import { resolveCtx } from './test-helpers/resolve-ctx'
import { testPlugin } from './test-helpers/test-plugin'
import { createSuccess, createError } from './test-helpers/factories'

const writeKey = 'foo'

beforeEach(() => {
  jest.resetAllMocks()
  fetcher.mockReturnValue(createSuccess())
})

describe('Initialization', () => {
  it('loads analytics-node-next plugin', async () => {
    const analytics = new AnalyticsNode({
      writeKey,
    })
    await analytics.ready

    const ajsNodeXt = analytics.queue.plugins.find(
      (xt) => xt.name === 'Segment.io'
    )
    expect(ajsNodeXt).toBeDefined()
    expect(ajsNodeXt?.isLoaded()).toBeTruthy()
  })
})

describe('Error handling', () => {
  it('writekey missing errors are surfaced as thrown errors', () => {
    expect(
      () =>
        new AnalyticsNode({
          writeKey: undefined as any,
        })
    ).toThrowError(/writeKey/i)
  })

  it('property validation errors are surfaced as thrown errors', async () => {
    const analytics = new AnalyticsNode({
      writeKey,
    })
    expect(() => analytics.track({} as any)).toThrowError(/event/i)
  })

  it.skip('http delivery errors are accessed through the emitter', (done) => {
    const analytics = new AnalyticsNode({
      writeKey,
      batchSettings: {
        maxAttempts: 1,
      },
    })
    fetcher.mockReturnValue(
      createError({ statusText: 'Service Unavailable', status: 503 })
    )

    analytics.track({ event: 'foo', userId: 'sup' })
    analytics.on('error', (emittedErr) => {
      if (emittedErr.code !== 'http_delivery') {
        return done.fail('error code incorrect')
      }
      expect(emittedErr.message).toMatch(/segment/)
      expect(emittedErr.code).toMatch(/http/)
      expect(emittedErr.response.status).toBe(503)
      done()
    })
    expect.assertions(3)
  })
})

describe('alias', () => {
  it('generates alias events', async () => {
    const analytics = new AnalyticsNode({ writeKey })

    analytics.alias({
      userId: 'chris radek',
      previousId: 'chris',
    })
    const ctx = await resolveCtx(analytics, 'alias')

    expect(ctx.event.userId).toEqual('chris radek')
    expect(ctx.event.previousId).toEqual('chris')
  })
})

describe('group', () => {
  it('generates group events', async () => {
    const analytics = new AnalyticsNode({ writeKey })

    analytics.group({
      groupId: 'coolKids',
      traits: { coolKids: true },
      userId: 'foo',
      anonymousId: 'bar',
    })
    const ctx = await resolveCtx(analytics, 'group')
    expect(ctx.event.groupId).toEqual('coolKids')
    expect(ctx.event.traits).toEqual({ coolKids: true })
    expect(ctx.event.userId).toEqual('foo')
    expect(ctx.event.anonymousId).toBe('bar')
  })

  it('invocations are isolated', async () => {
    const analytics = new AnalyticsNode({ writeKey })

    analytics.group({
      groupId: 'coolKids',
      traits: { foo: 'foo' },
      anonymousId: 'unknown',
    })
    const ctx1 = await resolveCtx(analytics, 'group')

    analytics.group({
      groupId: 'coolKids',
      traits: { bar: 'bar' },
      userId: 'me',
    })

    const ctx2 = await resolveCtx(analytics, 'group')

    expect(ctx1.event.traits).toEqual({ foo: 'foo' })
    expect(ctx1.event.anonymousId).toEqual('unknown')
    expect(ctx1.event.userId).toBeUndefined()

    expect(ctx2.event.traits).toEqual({ bar: 'bar' })
    expect(ctx2.event.anonymousId).toBeUndefined()
    expect(ctx2.event.userId).toEqual('me')
  })
})

describe('identify', () => {
  it('generates identify events', async () => {
    const analytics = new AnalyticsNode({ writeKey })
    analytics.identify({
      userId: 'user-id',
      traits: {
        name: 'Chris Radek',
      },
    })
    const ctx1 = await resolveCtx(analytics, 'identify')

    expect(ctx1.event.userId).toEqual('user-id')
    expect(ctx1.event.anonymousId).toBeUndefined()
    expect(ctx1.event.traits).toEqual({ name: 'Chris Radek' })

    analytics.identify({ userId: 'user-id', anonymousId: 'unknown' })
    const ctx2 = await resolveCtx(analytics, 'identify')

    expect(ctx2.event.userId).toEqual('user-id')
    expect(ctx2.event.anonymousId).toEqual('unknown')
    expect(ctx2.event.traits).toEqual({})
  })
})

describe('page', () => {
  it('generates page events', async () => {
    const analytics = new AnalyticsNode({ writeKey })

    const category = 'Docs'
    const name = 'How to write a test'

    analytics.page({ category, name, anonymousId: 'unknown' })
    const ctx1 = await resolveCtx(analytics, 'page')
    expect(ctx1.event.type).toEqual('page')
    expect(ctx1.event.name).toEqual(name)
    expect(ctx1.event.anonymousId).toEqual('unknown')
    expect(ctx1.event.userId).toBeUndefined()
    expect(ctx1.event.properties).toEqual({ category })

    analytics.page({ name, properties: { title: 'wip' }, userId: 'user-id' })

    const ctx2 = await resolveCtx(analytics, 'page')

    expect(ctx2.event.type).toEqual('page')
    expect(ctx2.event.name).toEqual(name)
    expect(ctx2.event.anonymousId).toBeUndefined()
    expect(ctx2.event.userId).toEqual('user-id')
    expect(ctx2.event.properties).toEqual({ title: 'wip' })

    analytics.page({ properties: { title: 'invisible' }, userId: 'user-id' })
    const ctx3 = await resolveCtx(analytics, 'page')

    expect(ctx3.event.type).toEqual('page')
    expect(ctx3.event.name).toBeUndefined()
    expect(ctx3.event.anonymousId).toBeUndefined()
    expect(ctx3.event.userId).toEqual('user-id')
    expect(ctx3.event.properties).toEqual({ title: 'invisible' })
  })
})

describe('screen', () => {
  it('generates screen events', async () => {
    const analytics = new AnalyticsNode({ writeKey })

    const name = 'Home Screen'

    analytics.screen({ name, properties: { title: 'wip' }, userId: 'user-id' })

    const ctx1 = await resolveCtx(analytics, 'screen')

    expect(ctx1.event.type).toEqual('screen')
    expect(ctx1.event.name).toEqual(name)
    expect(ctx1.event.anonymousId).toBeUndefined()
    expect(ctx1.event.userId).toEqual('user-id')
    expect(ctx1.event.properties).toEqual({ title: 'wip' })

    analytics.screen({ properties: { title: 'invisible' }, userId: 'user-id' })

    const ctx2 = await resolveCtx(analytics, 'screen')

    expect(ctx2.event.type).toEqual('screen')
    expect(ctx2.event.name).toBeUndefined()
    expect(ctx2.event.anonymousId).toBeUndefined()
    expect(ctx2.event.userId).toEqual('user-id')
    expect(ctx2.event.properties).toEqual({ title: 'invisible' })
  })
})

describe('track', () => {
  it('generates track events', async () => {
    const analytics = new AnalyticsNode({ writeKey })

    const eventName = 'Test Event'

    analytics.track({
      event: eventName,
      anonymousId: 'unknown',
      userId: 'known',
    })

    const ctx1 = await resolveCtx(analytics, 'track')

    expect(ctx1.event.type).toEqual('track')
    expect(ctx1.event.event).toEqual(eventName)
    expect(ctx1.event.properties).toEqual({})
    expect(ctx1.event.anonymousId).toEqual('unknown')
    expect(ctx1.event.userId).toEqual('known')

    analytics.track({
      event: eventName,
      properties: { foo: 'bar' },
      userId: 'known',
    })
    const ctx2 = await resolveCtx(analytics, 'track')

    expect(ctx2.event.type).toEqual('track')
    expect(ctx2.event.event).toEqual(eventName)
    expect(ctx2.event.properties).toEqual({ foo: 'bar' })
    expect(ctx2.event.anonymousId).toBeUndefined()
    expect(ctx2.event.userId).toEqual('known')
  })
})

describe('register', () => {
  it('registers a plugin', async () => {
    const analytics = new AnalyticsNode({ writeKey })

    await analytics.register(testPlugin)

    expect(testPlugin.load).toHaveBeenCalledTimes(1)
  })

  it('should wait for plugins to be registered before dispatching events', async () => {
    // TODO: ensure that this test _actually_ tests criticalTasks =S
    const analytics = new AnalyticsNode({ writeKey })
    analytics.identify({ userId: 'foo' })

    const register = new Promise((resolve) =>
      analytics.on('register', (plugins) => {
        if (plugins.includes('Test Plugin')) {
          resolve('register')
        }
      })
    )
    let resolveId: Function

    const identifyPluginCall = new Promise((_resolve) => {
      resolveId = _resolve
    })
    const plugin: Plugin = {
      ...testPlugin,
      identify: (ctx) => {
        resolveId('identify')
        return Promise.resolve(ctx)
      },
    }
    void analytics.register(plugin)

    const result = await Promise.race([identifyPluginCall, register])
    expect(result).toEqual('register')
    await identifyPluginCall
  })
})

describe('deregister', () => {
  it('deregisters a plugin given its name', async () => {
    const analytics = new AnalyticsNode({ writeKey })
    await analytics.register(testPlugin)

    await analytics.deregister(testPlugin.name)
    expect(testPlugin.unload).toHaveBeenCalledTimes(1)
  })
})

describe('version', () => {
  it('should return the version', () => {
    const analytics = new AnalyticsNode({ writeKey })
    expect(typeof +analytics.VERSION).toBe('number')
  })
})

describe('ready', () => {
  it('should only resolve when plugin registration is done', async () => {
    const analytics = new AnalyticsNode({ writeKey })
    expect(analytics.queue.plugins.length).toBe(0)
    const result = await analytics.ready
    expect(result).toBeUndefined()
    expect(analytics.queue.plugins.length).toBeGreaterThan(0)
  })

  it.skip('should not reject if a plugin fails registration during initialization?', async () => {
    // TODO: we should test the unhappy path
  })
})
