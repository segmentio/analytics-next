import { load, AnalyticsNode } from '../index'

import { CorePlugin as Plugin } from '@segment/analytics-core'
const writeKey = 'foo'

const testPlugin: Plugin = {
  isLoaded: jest.fn().mockReturnValue(true),
  load: jest.fn().mockResolvedValue(undefined),
  unload: jest.fn().mockResolvedValue(undefined),
  name: 'Test Plugin',
  type: 'destination',
  version: '0.1.0',
  alias: jest.fn((ctx) => Promise.resolve(ctx)),
  group: jest.fn((ctx) => Promise.resolve(ctx)),
  identify: jest.fn((ctx) => Promise.resolve(ctx)),
  page: jest.fn((ctx) => Promise.resolve(ctx)),
  screen: jest.fn((ctx) => Promise.resolve(ctx)),
  track: jest.fn((ctx) => Promise.resolve(ctx)),
}

describe('AnalyticsNode', () => {
  describe('Initialization', () => {
    it('loads analytics-node-next plugin', async () => {
      const [analytics] = await load({
        writeKey,
      })

      expect((analytics as any as AnalyticsNode).queue.plugins.length).toBe(2)

      const ajsNodeXt = (analytics as any as AnalyticsNode).queue.plugins.find(
        (xt) => xt.name === 'analytics-node-next'
      )
      expect(ajsNodeXt).toBeDefined()
      expect(ajsNodeXt?.isLoaded()).toBeTruthy()
    })
  })

  describe('alias', () => {
    it('generates alias events', async () => {
      const [analytics] = await load({ writeKey })

      const ctx = await analytics.alias('chris radek', 'chris')

      expect(ctx.event.userId).toEqual('chris radek')
      expect(ctx.event.previousId).toEqual('chris')
      expect(ctx.event.anonymousId).toBeUndefined()
    })

    it('populates anonymousId if provided', async () => {
      const [analytics] = await load({ writeKey })

      const ctx = await analytics.alias('chris radek', 'chris', {
        anonymousId: 'foo',
      })

      expect(ctx.event.userId).toEqual('chris radek')
      expect(ctx.event.previousId).toEqual('chris')
      expect(ctx.event.anonymousId).toEqual('foo')
    })
  })

  describe('group', () => {
    it('generates group events', async () => {
      const [analytics] = await load({ writeKey })

      const ctx = await analytics.group(
        'coolKids',
        { coolKids: true },
        {
          userId: 'foo',
        }
      )

      expect(ctx.event.groupId).toEqual('coolKids')
      expect(ctx.event.traits).toEqual({ coolKids: true })
      expect(ctx.event.userId).toEqual('foo')
      expect(ctx.event.anonymousId).toBeUndefined()
    })

    it('invocations are isolated', async () => {
      const [analytics] = await load({ writeKey })

      const ctx1 = await analytics.group(
        'coolKids',
        { foo: 'foo' },
        {
          anonymousId: 'unknown',
        }
      )

      const ctx2 = await analytics.group(
        'coolKids',
        { bar: 'bar' },
        {
          userId: 'me',
        }
      )

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
      const [analytics] = await load({ writeKey })

      const ctx1 = await analytics.identify('user-id', {
        name: 'Chris Radek',
      })

      expect(ctx1.event.userId).toEqual('user-id')
      expect(ctx1.event.anonymousId).toBeUndefined()
      expect(ctx1.event.traits).toEqual({ name: 'Chris Radek' })

      const ctx2 = await analytics.identify(
        'user-id',
        {},
        {
          anonymousId: 'unknown',
        }
      )

      expect(ctx2.event.userId).toEqual('user-id')
      expect(ctx2.event.anonymousId).toEqual('unknown')
      expect(ctx2.event.traits).toEqual({})
    })
  })

  describe('page', () => {
    it('generates page events', async () => {
      const [analytics] = await load({ writeKey })

      const category = 'Docs'
      const name = 'How to write a test'

      const ctx1 = await analytics.page(
        category,
        name,
        {},
        { anonymousId: 'unknown' }
      )

      expect(ctx1.event.type).toEqual('page')
      expect(ctx1.event.name).toEqual(name)
      expect(ctx1.event.anonymousId).toEqual('unknown')
      expect(ctx1.event.userId).toBeUndefined()
      expect(ctx1.event.properties).toEqual({ category })

      const ctx2 = await analytics.page(
        name,
        { title: 'wip' },
        { userId: 'user-id' }
      )

      expect(ctx2.event.type).toEqual('page')
      expect(ctx2.event.name).toEqual(name)
      expect(ctx2.event.anonymousId).toBeUndefined()
      expect(ctx2.event.userId).toEqual('user-id')
      expect(ctx2.event.properties).toEqual({ title: 'wip' })

      const ctx3 = await analytics.page(
        { title: 'invisible' },
        { userId: 'user-id' }
      )

      expect(ctx3.event.type).toEqual('page')
      expect(ctx3.event.name).toBeUndefined()
      expect(ctx3.event.anonymousId).toBeUndefined()
      expect(ctx3.event.userId).toEqual('user-id')
      expect(ctx3.event.properties).toEqual({ title: 'invisible' })
    })
  })

  describe('screen', () => {
    it('generates screen events', async () => {
      const [analytics] = await load({ writeKey })

      const name = 'Home Screen'

      const ctx1 = await analytics.screen(
        name,
        { title: 'wip' },
        { userId: 'user-id' }
      )

      expect(ctx1.event.type).toEqual('screen')
      expect(ctx1.event.name).toEqual(name)
      expect(ctx1.event.anonymousId).toBeUndefined()
      expect(ctx1.event.userId).toEqual('user-id')
      expect(ctx1.event.properties).toEqual({ title: 'wip' })

      const ctx2 = await analytics.screen(
        { title: 'invisible' },
        { userId: 'user-id' }
      )

      expect(ctx2.event.type).toEqual('screen')
      expect(ctx2.event.name).toBeUndefined()
      expect(ctx2.event.anonymousId).toBeUndefined()
      expect(ctx2.event.userId).toEqual('user-id')
      expect(ctx2.event.properties).toEqual({ title: 'invisible' })
    })
  })

  describe('track', () => {
    it('generates track events', async () => {
      const [analytics] = await load({ writeKey })

      const eventName = 'Test Event'

      const ctx1 = await analytics.track(
        eventName,
        {},
        {
          anonymousId: 'unknown',
          userId: 'known',
        }
      )

      expect(ctx1.event.type).toEqual('track')
      expect(ctx1.event.event).toEqual(eventName)
      expect(ctx1.event.properties).toEqual({})
      expect(ctx1.event.anonymousId).toEqual('unknown')
      expect(ctx1.event.userId).toEqual('known')

      const ctx2 = await analytics.track(
        eventName,
        { foo: 'bar' },
        {
          userId: 'known',
        }
      )

      expect(ctx2.event.type).toEqual('track')
      expect(ctx2.event.event).toEqual(eventName)
      expect(ctx2.event.properties).toEqual({ foo: 'bar' })
      expect(ctx2.event.anonymousId).toBeUndefined()
      expect(ctx2.event.userId).toEqual('known')
    })
  })

  describe('register', () => {
    it('registers a plugin', async () => {
      const [analytics] = await load({ writeKey })

      await analytics.register(testPlugin)

      expect(testPlugin.load).toHaveBeenCalledTimes(1)
    })
  })

  describe('deregister', () => {
    it('deregisters a plugin given its name', async () => {
      const [analytics] = await load({ writeKey })
      await analytics.register(testPlugin)

      await analytics.deregister(testPlugin.name)
      expect(testPlugin.unload).toHaveBeenCalledTimes(1)
    })
  })
})
