import { Plugin } from '../app/types'
import { resolveCtx } from './test-helpers/resolve-ctx'
import { testPlugin } from './test-helpers/test-plugin'
import { createError } from './test-helpers/factories'
import {
  createTestAnalytics,
  TestFetchClient,
} from './test-helpers/create-test-analytics'

const writeKey = 'foo'
jest.setTimeout(10000)
const timestamp = new Date()

const testClient = new TestFetchClient()
const sendSpy = jest.spyOn(testClient, 'makeRequest')

describe('Settings / Configuration Init', () => {
  it('throws if no writeKey', () => {
    expect(() =>
      createTestAnalytics({
        writeKey: undefined as any,
      })
    ).toThrowError(/writeKey/i)
  })

  it('allows host/path to override default client', async () => {
    const analytics = createTestAnalytics({
      host: 'http://foo.com',
      path: '/bar',
      httpClient: testClient,
    })
    const track = resolveCtx(analytics, 'track')
    analytics.track({ event: 'foo', userId: 'sup' })
    await track
    expect(sendSpy.mock.calls[0][0]).toBe('http://foo.com/bar')
  })

  it('throws if host / path is bad', async () => {
    expect(() =>
      createTestAnalytics({
        writeKey,
        host: 'SHOULD_FAIL',
        path: '/bar',
      })
    ).toThrowError()
  })
})

describe('Error handling', () => {
  it('surfaces property thrown errors', async () => {
    const analytics = createTestAnalytics()
    expect(() => analytics.track({} as any)).toThrowError(/event/i)
  })

  it('should emit on an error', async () => {
    const err = createError({
      statusText: 'Service Unavailable',
      status: 503,
    })
    const analytics = createTestAnalytics({
      maxRetries: 0,
      httpClient: new TestFetchClient({ response: err }),
    })
    try {
      const promise = resolveCtx(analytics, 'track')
      analytics.track({ event: 'foo', userId: 'sup' })
      await promise
      throw new Error('fail')
    } catch (err: any) {
      expect(err.reason).toEqual(new Error('[503] Service Unavailable'))
      expect(err.code).toMatch(/delivery_failure/)
    }
  })
})

describe('alias', () => {
  it('generates alias events', async () => {
    const analytics = createTestAnalytics()
    analytics.alias({
      userId: 'chris radek',
      previousId: 'chris',
      timestamp: timestamp,
    })
    const ctx = await resolveCtx(analytics, 'alias')

    expect(ctx.event.userId).toEqual('chris radek')
    expect(ctx.event.previousId).toEqual('chris')
    expect(ctx.event.timestamp).toEqual(timestamp)
  })
})

describe('group', () => {
  const analytics = createTestAnalytics()
  it('generates group events', async () => {
    analytics.group({
      groupId: 'coolKids',
      traits: { coolKids: true },
      userId: 'foo',
      anonymousId: 'bar',
      timestamp: timestamp,
    })
    const ctx = await resolveCtx(analytics, 'group')
    expect(ctx.event.groupId).toEqual('coolKids')
    expect(ctx.event.traits).toEqual({ coolKids: true })
    expect(ctx.event.userId).toEqual('foo')
    expect(ctx.event.anonymousId).toBe('bar')
    expect(ctx.event.timestamp).toEqual(timestamp)
  })

  it('invocations are isolated', async () => {
    const analytics = createTestAnalytics()
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
    const analytics = createTestAnalytics()
    analytics.identify({
      timestamp: timestamp,
      userId: 'user-id',
      traits: {
        name: 'Chris Radek',
      },
    })
    const ctx1 = await resolveCtx(analytics, 'identify')

    expect(ctx1.event.userId).toEqual('user-id')
    expect(ctx1.event.anonymousId).toBeUndefined()
    expect(ctx1.event.traits).toEqual({ name: 'Chris Radek' })
    expect(ctx1.event.timestamp).toEqual(timestamp)

    analytics.identify({ userId: 'user-id', anonymousId: 'unknown' })
    const ctx2 = await resolveCtx(analytics, 'identify')

    expect(ctx2.event.userId).toEqual('user-id')
    expect(ctx2.event.anonymousId).toEqual('unknown')
    expect(ctx2.event.traits).toEqual({})
    expect(ctx2.event.timestamp).toEqual(expect.any(Date))
  })
})

describe('page', () => {
  it('generates page events', async () => {
    const analytics = createTestAnalytics()
    const category = 'Docs'
    const name = 'How to write a test'
    analytics.page({
      category,
      name,
      anonymousId: 'unknown',
      timestamp: timestamp,
    })
    const ctx1 = await resolveCtx(analytics, 'page')
    expect(ctx1.event.type).toEqual('page')
    expect(ctx1.event.name).toEqual(name)
    expect(ctx1.event.anonymousId).toEqual('unknown')
    expect(ctx1.event.userId).toBeUndefined()
    expect(ctx1.event.properties).toEqual({ category })
    expect(ctx1.event.timestamp).toEqual(timestamp)

    analytics.page({ name, properties: { title: 'wip' }, userId: 'user-id' })

    const ctx2 = await resolveCtx(analytics, 'page')

    expect(ctx2.event.type).toEqual('page')
    expect(ctx2.event.name).toEqual(name)
    expect(ctx2.event.anonymousId).toBeUndefined()
    expect(ctx2.event.userId).toEqual('user-id')
    expect(ctx2.event.properties).toEqual({ title: 'wip' })
    expect(ctx2.event.timestamp).toEqual(expect.any(Date))

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
    const analytics = createTestAnalytics()
    const name = 'Home Screen'

    analytics.screen({
      name,
      properties: { title: 'wip' },
      userId: 'user-id',
      timestamp: timestamp,
    })

    const ctx1 = await resolveCtx(analytics, 'screen')

    expect(ctx1.event.type).toEqual('screen')
    expect(ctx1.event.name).toEqual(name)
    expect(ctx1.event.anonymousId).toBeUndefined()
    expect(ctx1.event.userId).toEqual('user-id')
    expect(ctx1.event.properties).toEqual({ title: 'wip' })
    expect(ctx1.event.timestamp).toEqual(timestamp)

    analytics.screen({
      properties: { title: 'invisible' },
      userId: 'user-id',
    })

    const ctx2 = await resolveCtx(analytics, 'screen')

    expect(ctx2.event.type).toEqual('screen')
    expect(ctx2.event.name).toBeUndefined()
    expect(ctx2.event.anonymousId).toBeUndefined()
    expect(ctx2.event.userId).toEqual('user-id')
    expect(ctx2.event.properties).toEqual({ title: 'invisible' })
    expect(ctx2.event.timestamp).toEqual(expect.any(Date))
  })
})

describe('track', () => {
  it('generates track events', async () => {
    const analytics = createTestAnalytics()
    const eventName = 'Test Event'

    analytics.track({
      event: eventName,
      anonymousId: 'unknown',
      userId: 'known',
      timestamp: timestamp,
    })

    const ctx1 = await resolveCtx(analytics, 'track')

    expect(ctx1.event.type).toEqual('track')
    expect(ctx1.event.event).toEqual(eventName)
    expect(ctx1.event.properties).toEqual({})
    expect(ctx1.event.anonymousId).toEqual('unknown')
    expect(ctx1.event.userId).toEqual('known')
    expect(ctx1.event.timestamp).toEqual(timestamp)

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
    expect(ctx2.event.timestamp).toEqual(expect.any(Date))
  })
})

describe('register', () => {
  it('registers a plugin', async () => {
    const analytics = createTestAnalytics()
    await analytics.register(testPlugin)

    expect(testPlugin.load).toHaveBeenCalledTimes(1)
  })

  it('should wait for plugins to be registered before dispatching events', async () => {
    const analytics = createTestAnalytics()
    // TODO: ensure that this test _actually_ tests criticalTasks =S
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
    const analytics = createTestAnalytics()
    await analytics.register(testPlugin)

    await analytics.deregister(testPlugin.name)
    expect(testPlugin.unload).toHaveBeenCalledTimes(1)
  })
})

describe('version', () => {
  it('should return the version', () => {
    const analytics = createTestAnalytics()
    expect(typeof +analytics.VERSION).toBe('number')
  })
})

describe('ready', () => {
  it('should only resolve when plugin registration is done', async () => {
    const analytics = createTestAnalytics()
    expect(analytics['_queue'].plugins.length).toBe(0)
    const result = await analytics.ready
    expect(result).toBeUndefined()
    expect(analytics['_queue'].plugins.length).toBeGreaterThan(0)
  })

  it.skip('should not reject if a plugin fails registration during initialization?', async () => {
    // TODO: we should test the unhappy path
  })
})
