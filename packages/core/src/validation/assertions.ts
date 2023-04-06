import { CoreSegmentEvent } from '../events'
import { hasUser, isString, isPlainObject } from './helpers'

export class ValidationError extends Error {
  field: string

  constructor(field: string, message: string) {
    super(`${field} ${message}`)
    this.field = field
  }
}

export function validateEvent(event?: CoreSegmentEvent | null) {
  if (!event || typeof event !== 'object') {
    throw new ValidationError('event', 'is missing')
  }

  if (!isString(event.type)) {
    throw new ValidationError('type', 'is not a string')
  }

  if (event.type === 'track') {
    if (!isString(event.event)) {
      throw new ValidationError('event', 'is not a string')
    }
    if (!isPlainObject(event.properties)) {
      throw new ValidationError('properties', 'is not an object')
    }
  }

  if (['group', 'identify'].includes(event.type)) {
    if (!isPlainObject(event.traits)) {
      throw new ValidationError('traits', 'is not an object')
    }
  }

  if (!hasUser(event)) {
    throw new ValidationError(
      'userId/anonymousId/previousId/groupId',
      'must have an ID AND must be string'
    )
  }
}
