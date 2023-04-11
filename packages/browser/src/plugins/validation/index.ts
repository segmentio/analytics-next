import type { Plugin } from '../../core/plugin'
import type { Context } from '../../core/context'
import {
  validateUser,
  isString,
  isPlainObject,
  ValidationError,
} from '@segment/analytics-core'

function validate(ctx: Context): Context {
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

  validateUser(event)
  return ctx
}

export const validation: Plugin = {
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
