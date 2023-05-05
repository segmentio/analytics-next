import { CoreCustomerioEvent } from '../../events'
import { validateEvent } from '../assertions'

const baseEvent: Partial<CoreCustomerioEvent> = {
  userId: 'foo',
  event: 'Test Event',
}
describe('validateEvent', () => {
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

  test('should require either a user ID or anonymous ID or previousID or Group ID for all events', () => {
    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'track',
        properties: {},
        userId: undefined,
        anonymousId: 'foo',
      })
    ).not.toThrow()

    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'identify',
        traits: {},
        userId: 'foo',
        anonymousId: undefined,
      })
    ).not.toThrow()

    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'alias',
        previousId: 'foo',
        userId: undefined,
        anonymousId: undefined,
      })
    ).not.toThrow()

    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'group',
        traits: {},
        groupId: 'foo',
      })
    ).not.toThrow()

    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'alias',
        previousId: undefined,
        userId: undefined,
        anonymousId: undefined,
      })
    ).toThrow()
  })
})
