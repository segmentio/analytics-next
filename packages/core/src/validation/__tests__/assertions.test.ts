import { CoreSegmentEvent } from '../../events'
import { validateEvent } from '../assertions'

const baseEvent: CoreSegmentEvent = {
  type: 'track',
  userId: 'foo',
  event: 'Test Event',
  properties: { name: 'foo' },
}
describe('validateEvent', () => {
  test('should be capable of working with empty properties and traits', () => {
    expect(() => validateEvent(undefined)).toThrowErrorMatchingInlineSnapshot(
      `"Event is missing"`
    )
    expect(() => validateEvent(null)).toThrowErrorMatchingInlineSnapshot(
      `"Event is missing"`
    )
    expect(() => validateEvent({} as any)).toThrowErrorMatchingInlineSnapshot(
      `".type is missing"`
    )
    expect(() =>
      validateEvent('foo' as any)
    ).toThrowErrorMatchingInlineSnapshot(`"Event is missing"`)
  })

  test('properties / traits should be plain objects', () => {
    expect(() =>
      validateEvent({ ...baseEvent, properties: undefined, traits: [] as any })
    ).toThrowErrorMatchingInlineSnapshot(`"properties is not an object"`)

    expect(() =>
      validateEvent({ ...baseEvent, properties: [] as any })
    ).toThrowErrorMatchingInlineSnapshot(`"properties is not an object"`)
  })

  test('track: properties should be an object', () => {
    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'track',
        properties: {},
      })
    ).not.toThrow()
    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'track',
        properties: null as any,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"properties is not an object"`)

    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'track',
        properties: undefined,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"properties is not an object"`)
  })

  test('identify: traits should be an object', () => {
    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'track',
        properties: null as any,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"properties is not an object"`)

    expect(() =>
      validateEvent({
        ...baseEvent,
        properties: undefined,
        type: 'identify',
        traits: undefined,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"properties is not an object"`)

    expect(() =>
      validateEvent({
        ...baseEvent,
        properties: undefined,
        type: 'identify',
        traits: null as any,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"properties is not an object"`)
  })

  test('alias: should allow both traints and properties to be undefined (unlike other events)', () => {
    expect(() =>
      validateEvent({
        ...baseEvent,
        type: 'alias',
        properties: undefined,
        traits: undefined,
      })
    ).not.toThrow()

    expect(() =>
      validateEvent({
        ...baseEvent,
        properties: undefined,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"properties is not an object"`)
  })

  test('should require either a user ID or anonymous ID for all events', () => {
    expect(() =>
      validateEvent({
        ...baseEvent,
        userId: undefined,
        anonymousId: 'foo',
      })
    ).not.toThrow()
    expect(() =>
      validateEvent({
        ...baseEvent,
        userId: 'foo',
        anonymousId: undefined,
      })
    ).not.toThrow()
    expect(() =>
      validateEvent({
        ...baseEvent,
        userId: undefined,
        anonymousId: undefined,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"Missing userId or anonymousId"`)
  })
})
