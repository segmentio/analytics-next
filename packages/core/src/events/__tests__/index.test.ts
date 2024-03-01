import { EventFactory } from '..'
import { CoreSegmentEvent } from '../..'
import { isDate } from 'lodash'

describe('Event Factory', () => {
  let factory: EventFactory
  const shoes = { product: 'shoes', total: '$35', category: 'category' }
  const shopper = { totalSpent: 100 }

  beforeEach(() => {
    class TestEventFactory extends EventFactory {
      constructor() {
        super({
          createMessageId: () => 'foo',
        })
      }
    }

    factory = new TestEventFactory()
  })

  describe('alias', () => {
    test('creates alias events', () => {
      const alias = factory.alias('netto', 'netto farah')

      expect(alias.type).toEqual('alias')
      expect(alias.event).toBeUndefined()

      expect(alias.userId).toEqual('netto')
      expect(alias.previousId).toEqual('netto farah')
    })

    it('does not accept traits or properties', () => {
      // TODO: you can still pass traits here in the options object?
      const alias = factory.alias('netto', 'netto farah')
      expect(alias.traits).toBeUndefined()
      expect(alias.properties).toBeUndefined()
    })
  })

  describe('group', () => {
    test('creates group events', () => {
      const group = factory.group('userId', { coolkids: true })

      expect(group.traits).toEqual({ coolkids: true })
      expect(group.type).toEqual('group')
      expect(group.event).toBeUndefined()
      expect(group.anonymousId).toBeUndefined()
    })

    it('accepts traits', () => {
      const group = factory.group('netto', shopper)
      expect(group.traits).toEqual(shopper)
    })

    it('sets the groupId to the message', () => {
      const group = factory.group('coolKidsId', { coolkids: true })
      expect(group.groupId).toEqual('coolKidsId')
    })

    test('should be capable of working with empty traits', () => {
      expect(() => factory.group('foo')).not.toThrow()
      expect(() => factory.group('foo', null as any)).not.toThrow()
    })
  })

  describe('page', () => {
    test('creates page events', () => {
      const page = factory.page('category', 'name', undefined, {
        userId: 'foo',
      })
      expect(page.traits).toBeUndefined()
      expect(page.type).toEqual('page')
      expect(page.event).toBeUndefined()
      expect(page.name).toEqual('name')
      expect(page.category).toEqual('category')
    })

    it('accepts properties', () => {
      const page = factory.page('category', 'name', shoes, { userId: 'foo' })
      expect(page.properties).toEqual(shoes)
    })

    it('ignores category and page if not passed in', () => {
      const page = factory.page(null, null, undefined, { userId: 'foo' })
      expect(page.category).toBeUndefined()
      expect(page.name).toBeUndefined()
    })
  })

  describe('identify', () => {
    test('creates identify events', () => {
      const identify = factory.identify('Netto', shopper)
      expect(identify.traits).toEqual(shopper)
      expect(identify.properties).toBeUndefined()
      expect(identify.type).toEqual('identify')
      expect(identify.event).toBeUndefined()
    })
    test('should be capable of working with empty traits', () => {
      expect(() => factory.identify('foo')).not.toThrow()
      expect(() => factory.identify('foo', null as any)).not.toThrow()
    })

    test('should coerce nullish traits to empty object', () => {
      const id = factory.identify('Order Completed')
      expect(id.traits).toEqual({})
      expect(id.properties).toBe(undefined)
    })
  })

  describe('track', () => {
    test('should only accept object literals as properties', () => {
      expect(() => factory.track('track', [])).toThrowError(/properties/)
    })

    test('creates track events', () => {
      const track = factory.track('Order Completed', shoes, { userId: 'foo' })
      expect(track.event).toEqual('Order Completed')
      expect(track.properties).toEqual(shoes)
      expect(track.traits).toBeUndefined()
      expect(track.type).toEqual('track')
    })

    test('adds a message id', () => {
      const track = factory.track('Order Completed', shoes, { userId: 'foo' })
      expect(typeof track.messageId).toBe('string')
    })

    test('adds a timestamp', () => {
      const track = factory.track('Order Completed', shoes, { userId: 'foo' })
      expect(track.timestamp).toBeInstanceOf(Date)
    })

    test('sets options in the context', () => {
      const track = factory.track('Order Completed', shoes, {
        userId: 'foo',
        opt1: true,
      })
      expect(track.context).toEqual({ opt1: true })
    })

    test('sets integrations', () => {
      const track = factory.track(
        'Order Completed',
        shoes,
        {
          userId: 'foo',
        },
        {
          amplitude: false,
        }
      )

      expect(track.integrations).toEqual({ amplitude: false })
    })

    test('merges integrations from `options` and `integrations`', () => {
      const track = factory.track(
        'Order Completed',
        shoes,
        {
          userId: 'foo',
          opt1: true,
          integrations: {
            amplitude: false,
          },
        },
        {
          googleAnalytics: true,
          amplitude: true,
        }
      )

      expect(track.integrations).toEqual({
        googleAnalytics: true,
        amplitude: false,
      })
    })

    test('do not send integration settings overrides from initialization', () => {
      const track = factory.track(
        'Order Completed',
        shoes,
        {
          userId: 'foo',
          integrations: {
            Amplitude: {
              sessionId: 'session_123',
            },
          },
        },
        {
          'Segment.io': {
            apiHost: 'custom',
          },
          GoogleAnalytics: false,

          'Customer.io': {},
        }
      )

      expect(track.integrations).toEqual({
        // do not pass Segment.io global settings
        'Segment.io': true,
        // accept amplitude event level settings
        Amplitude: {
          sessionId: 'session_123',
        },
        // pass along google analytics setting
        GoogleAnalytics: false,
        // empty objects are still valid
        'Customer.io': true,
      })
    })

    test('should move foreign options into `context`', () => {
      const track = factory.track('Order Completed', shoes, {
        userId: 'foo',
        opt1: true,
        opt2: '🥝',
        integrations: {
          amplitude: false,
        },
      })

      expect(track.context).toEqual({ opt1: true, opt2: '🥝' })
    })

    test('should not move known options into `context`', () => {
      const track = factory.track('Order Completed', shoes, {
        userId: 'foo',
        opt1: true,
        opt2: '🥝',
        integrations: {
          amplitude: false,
        },
        anonymousId: 'anon-1',
        timestamp: new Date(),
      })

      expect(track.context).toEqual({ opt1: true, opt2: '🥝' })
    })

    test('accepts an anonymous id', () => {
      const track = factory.track('Order Completed', shoes, {
        anonymousId: 'anon-1',
      })

      expect(track.context).toEqual({})
      expect(track.anonymousId).toEqual('anon-1')
    })

    test('accepts a timestamp', () => {
      const timestamp = new Date()
      const track = factory.track('Order Completed', shoes, {
        userId: 'foo',
        timestamp,
      })

      expect(track.context).toEqual({})
      expect(track.timestamp).toEqual(timestamp)
    })

    test('accepts traits', () => {
      const track = factory.track('Order Completed', shoes, {
        userId: 'foo',
        traits: {
          cell: '📱',
        },
      })
      expect(track.traits).toEqual(undefined) // This seems silly -- should we change this??

      expect(track.context?.traits).toEqual({
        cell: '📱',
      })
    })

    test('accepts a context object', () => {
      const track = factory.track('Order Completed', shoes, {
        userId: 'foo',
        context: {
          library: {
            name: 'ajs-next',
            version: '0.1.0',
          },
        },
      })

      expect(track.context).toEqual({
        library: {
          name: 'ajs-next',
          version: '0.1.0',
        },
      })
    })

    test('merges a context object', () => {
      const track = factory.track('Order Completed', shoes, {
        userId: 'foo',
        foreignProp: '🇧🇷',
        context: {
          innerProp: '👻',
          library: {
            name: 'ajs-next',
            version: '0.1.0',
          },
        },
      })

      expect(track.context).toEqual({
        library: {
          name: 'ajs-next',
          version: '0.1.0',
        },
        foreignProp: '🇧🇷',
        innerProp: '👻',
      })
    })

    test('accepts a messageId', () => {
      const messageId = 'business-id-123'
      const track = factory.track('Order Completed', shoes, {
        userId: 'foo',
        messageId,
      })

      expect(track.context).toEqual({})
      expect(track.messageId).toEqual(messageId)
    })

    it('should ignore undefined options', () => {
      const event = factory.track(
        'Order Completed',
        { ...shoes },
        { userId: 'foo', timestamp: undefined, traits: { foo: 123 } }
      )

      expect(typeof event.timestamp).toBe('object')
      expect(isDate(event.timestamp)).toBeTruthy()
    })
  })

  describe('normalize', () => {
    it('should merge original with normalized', () => {
      const msg: CoreSegmentEvent = {
        type: 'track',
        event: 'My Event',
        properties: {},
        options: {
          integrations: { Segment: true },
        },
        userId: 'user-id',
      }
      const normalized = factory['normalize'](msg)

      delete normalized.messageId

      expect(normalized.timestamp).toBeInstanceOf(Date)
      delete normalized.timestamp

      expect(normalized).toStrictEqual({
        type: msg.type,
        event: msg.event,
        userId: msg.userId,
        properties: msg.properties,
        integrations: { Segment: true },
        context: {},
      })
    })
  })
})
