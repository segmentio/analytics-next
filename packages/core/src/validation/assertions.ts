import { CoreSegmentEvent } from '../events'
import { hasUser, isString, isPlainObject } from './helpers'

export class ValidationError extends Error {
  field: string

  constructor(field: string, message: string) {
    super(message)
    this.field = field
  }
}

export function validateEvent(event?: CoreSegmentEvent | null) {
  if (!event || typeof event !== 'object') {
    throw new ValidationError('event', 'Event is missing')
  }

  if (!('type' in event)) {
    throw new ValidationError('event', '.type is missing')
  }

  const eventType = event.type

  if (!isString(eventType)) {
    throw new ValidationError('event', 'Event is not a string')
  }

  if (eventType === 'track' && !isString(event.event)) {
    throw new ValidationError('event', 'Event is not a string')
  }

  const props = event.properties ?? event.traits // TODO: properties can be undefined/null, but traits must be empty object. We should have seperate checks.
  if (eventType !== 'alias' && !isPlainObject(props)) {
    throw new ValidationError('properties', 'properties is not an object')
  }

  if (!hasUser(event)) {
    throw new ValidationError('userId', 'Missing userId or anonymousId')
  }
}
