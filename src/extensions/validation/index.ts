import { Extension } from '../../core/extension'
import { SegmentEvent } from '../../core/events'

export function isString(obj: unknown): obj is string {
  return typeof obj === 'string'
}

export function isFunction(obj: unknown): obj is Function {
  return typeof obj === 'function'
}

export function isPlainObject(obj: unknown): obj is object {
  return typeof obj == 'object' && obj !== null && obj.constructor == Object
}

function hasUser(event: SegmentEvent): boolean {
  const id = event.userId ?? event.anonymousId ?? event.groupId ?? event.previousId
  return isString(id)
}

class ValidationError extends Error {
  field: string

  constructor(field: string, message: string) {
    super(message)
    this.field = field
  }
}

function validate(eventType?: unknown, event?: SegmentEvent): void {
  if (event === undefined) {
    throw new ValidationError('event', 'Event is missing')
  }

  if (!isString(eventType)) {
    throw new ValidationError('event', 'Event is not a string')
  }

  if (eventType === 'track' && !isString(event.event)) {
    throw new ValidationError('event', 'Event is not a string')
  }

  const props = event.properties ?? event.traits
  if (eventType !== 'alias' && !isPlainObject(props)) {
    throw new ValidationError('properties', 'properties is not an object')
  }

  if (!hasUser(event)) {
    throw new ValidationError('userId', 'Missing userId or anonymousId')
  }
}

export const validation: Extension = {
  name: 'Event Validation',
  type: 'before',
  version: '1.0.0',

  isLoaded: () => true,
  load: () => Promise.resolve(),

  track: async (ctx) => {
    validate('track', ctx.event)
    return ctx
  },

  identify: async (ctx) => {
    validate('identify', ctx.event)
    return ctx
  },

  page: async (ctx) => {
    validate('page', ctx.event)
    return ctx
  },

  group: async (ctx) => {
    validate('group', ctx.event)
    return ctx
  },

  alias: async (ctx) => {
    validate('alias', ctx.event)
    return ctx
  },
}
