import { SegmentEvent } from '../events'

function isString(obj: unknown): obj is string {
  return typeof obj === 'string'
}

function isPlainObject(obj: unknown): obj is object {
  return typeof obj == 'object' && obj !== null && obj.constructor == Object
}

type MaybeId = { userId?: unknown; anonymousId?: unknown }

function hasUser(properties: MaybeId): boolean {
  const id = properties['userId'] ?? properties['anonymousId']
  return isString(id)
}

class ValidationError extends Error {
  field: string

  constructor(field: string, message: string) {
    super(message)
    this.field = field
  }
}

export function validate(eventType?: unknown, event?: unknown | SegmentEvent): void {
  if (!isString(eventType)) {
    throw new ValidationError('event', 'Event is not a string')
  }

  if (!isPlainObject(event)) {
    throw new ValidationError('properties', 'properties is not an object')
  }

  if (!hasUser(event)) {
    throw new ValidationError('userId', 'Missing userId or anonymousId')
  }
}
