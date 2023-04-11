import { CoreSegmentEvent } from '../events'
import { ValidationError } from './errors'
import { isString, isPlainObject, exists } from './helpers'

export function assertUserIdentity(event: CoreSegmentEvent): void {
  const USER_FIELD_NAME = '.userId/anonymousId/previousId/groupId'

  const getAnyUserId = (event: CoreSegmentEvent) =>
    event.userId ?? event.anonymousId ?? event.groupId ?? event.previousId

  const id = getAnyUserId(event)
  if (!exists(id)) {
    throw new ValidationError(USER_FIELD_NAME, 'is not defined')
  } else if (!isString(id)) {
    throw new ValidationError(USER_FIELD_NAME, 'is not a string')
  }
}

export function assertEventExists(
  event?: CoreSegmentEvent | null
): asserts event is CoreSegmentEvent {
  if (!event || typeof event !== 'object') {
    throw new ValidationError('Event', 'is nil')
  }
}

export function assertEventType(event: CoreSegmentEvent): void {
  if (!isString(event.type)) {
    throw new ValidationError('.type', 'is not a string')
  }
}

export function assertTrackEventName(event: CoreSegmentEvent): void {
  if (!isString(event.event)) {
    throw new ValidationError('.event', 'is not a string')
  }
}

export function assertTrackEventProperties(event: CoreSegmentEvent): void {
  if (!isPlainObject(event.properties)) {
    throw new ValidationError('.properties', 'is not an object')
  }
}

export function validateEvent(event?: CoreSegmentEvent | null) {
  assertEventExists(event)
  assertEventType(event)

  if (event.type === 'track') {
    assertTrackEventName(event)
    assertTrackEventProperties(event)
  }

  if (['group', 'identify'].includes(event.type)) {
    if (!isPlainObject(event.traits)) {
      throw new ValidationError('.traits', 'is not an object')
    }
  }
  assertUserIdentity(event)
}
