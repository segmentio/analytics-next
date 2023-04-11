import { CoreSegmentEvent } from '../events'
import { ValidationError } from './errors'
import { isString, isPlainObject, exists } from './helpers'

export function validateUser(event: CoreSegmentEvent): void {
  const USER_FIELD_NAME = 'userId/anonymousId/previousId/groupId'

  const getAnyUserId = (event: CoreSegmentEvent) =>
    event.userId ?? event.anonymousId ?? event.groupId ?? event.previousId

  const id = getAnyUserId(event)
  if (!exists(id)) {
    throw new ValidationError(USER_FIELD_NAME, `Must have ${USER_FIELD_NAME}`)
  } else if (!isString(id)) {
    throw new ValidationError(
      USER_FIELD_NAME,
      `${USER_FIELD_NAME} must be string`
    )
  }
}

export function validateEvent(event?: CoreSegmentEvent | null) {
  if (!event || typeof event !== 'object') {
    throw new ValidationError('event', 'Event is missing')
  }

  if (!isString(event.type)) {
    throw new ValidationError('type', 'type is not a string')
  }

  if (event.type === 'track') {
    if (!isString(event.event)) {
      throw new ValidationError('event', 'Event is not a string')
    }
    if (!isPlainObject(event.properties)) {
      throw new ValidationError('properties', 'properties is not an object')
    }
  }

  if (['group', 'identify'].includes(event.type)) {
    if (!isPlainObject(event.traits)) {
      throw new ValidationError('traits', 'traits is not an object')
    }
  }
  validateUser(event)
}
