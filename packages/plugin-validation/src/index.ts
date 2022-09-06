import {
  CoreContext,
  isString,
  isPlainObject,
  hasUser,
  CorePlugin,
} from '@segment/analytics-core'

class ValidationError extends Error {
  field: string

  constructor(field: string, message: string) {
    super(message)
    this.field = field
  }
}

function validate(ctx: CoreContext): CoreContext {
  const eventType: unknown = ctx && ctx.event && ctx.event.type
  const event = ctx.event

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

  return ctx
}

export const validation: CorePlugin = {
  name: 'Event Validation',
  type: 'before',
  version: '1.0.0',

  isLoaded: () => true,
  load: () => Promise.resolve(),

  track: validate,
  identify: validate,
  page: validate,
  alias: validate,
  group: validate,
  screen: validate,
}
