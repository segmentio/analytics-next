import { CoreSegmentEvent } from '../../events'
import { assertUserIdentity, validateEvent } from '../assertions'

const baseEvent: Partial<CoreSegmentEvent> = {
  userId: 'foo',
  event: 'Test Event',
  messageId: 'foo',
}

describe(assertUserIdentity, () => {
  test('should pass if either a userID/anonymousID/previousID/groupID are defined', () => {
    expect(() =>
      assertUserIdentity({
        ...baseEvent,
        type: 'track',
        properties: {},
        userId: undefined,
        anonymousId: 'foo',
      })
    ).not.toThrow()

    expect(() =>
      assertUserIdentity({
        ...baseEvent,
        type: 'identify',
        traits: {},
        userId: 'foo',
        anonymousId: undefined,
      })
    ).not.toThrow()

    expect(() =>
      assertUserIdentity({
        ...baseEvent,
        type: 'alias',
        previousId: 'foo',
        userId: undefined,
        anonymousId: undefined,
      })
    ).not.toThrow()

    expect(() =>
      assertUserIdentity({
        ...baseEvent,
        type: 'group',
        traits: {},
        groupId: 'foo',
      })
    ).not.toThrow()
  })

  test('should fail if ID is _not_ string', () => {
    expect(() =>
      assertUserIdentity({
        ...baseEvent,
        type: 'track',
        properties: {},
        userId: undefined,
        anonymousId: 123 as any,
      })
    ).toThrowError(/string/)

    expect(() =>
      assertUserIdentity({
        ...baseEvent,
        type: 'track',
        properties: {},
        userId: undefined,
        anonymousId: 123 as any,
      })
    ).toThrowError(/string/)
  })

  test('should handle null as well as undefined', () => {
    expect(() =>
      assertUserIdentity({
        ...baseEvent,
        type: 'track',
        properties: {},
        userId: undefined,
        anonymousId: null,
      })
    ).toThrowError(/nil/i)
  })
})

describe(validateEvent, () => {
  test('should be capable of working with empty properties and traits', () => {
    expect(() => validateEvent(undefined)).toThrowError()
    expect(() => validateEvent(null)).toThrowError()
    expect(() => validateEvent({} as any)).toThrowError()
    expect(() => validateEvent('foo' as any)).toThrowError()
  })

  test('on track, properties should be plain objects', () => {
    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'track',
        properties: [],
      })
    ).toThrowError(/properties/i)
    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'track',
        properties: undefined,
      })
    ).toThrowError(/properties/i)
    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'track',
        properties: {},
      })
    ).not.toThrow()
  })

  test('identify: traits should be an object', () => {
    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'identify',
        traits: undefined,
      })
    ).toThrowError(/traits/i)

    expect(() =>
      validateEvent({
        ...baseEvent,
        properties: {},
        type: 'identify',
        traits: undefined,
      })
    ).toThrowError(/traits/i)

    expect(() =>
      validateEvent({
        ...baseEvent,
        properties: undefined,
        type: 'identify',
        traits: null as any,
      })
    ).toThrowError(/traits/i)
  })

  test('alias: should allow both traits and properties to be undefined (unlike other events)', () => {
    expect(() =>
      validateEvent({
        ...baseEvent,
        previousId: 'foo',
        type: 'alias',
        properties: undefined,
        traits: undefined,
      })
    ).not.toThrow()
  })

  test('should fail if messageId is _not_ string', () => {
    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'track',
        properties: {},
        userId: undefined,
        anonymousId: 'foo',
        messageId: 'bar',
      })
    ).not.toThrow()

    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'track',
        properties: {},
        userId: undefined,
        anonymousId: 'foo',
        messageId: 123 as any,
      })
    ).toThrow(/messageId/)
  })
})
