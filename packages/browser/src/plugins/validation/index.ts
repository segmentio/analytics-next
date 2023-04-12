import type { Plugin } from '../../core/plugin'
import type { Context } from '../../core/context'
import {
  assertUserIdentity,
  isPlainObject,
  ValidationError,
  assertEventExists,
  assertEventType,
  assertTrackEventName,
} from '@segment/analytics-core'

function validate(ctx: Context): Context {
  const event = ctx.event
  assertEventExists(event)
  assertEventType(event)

  if (event.type === 'track') {
    assertTrackEventName(event)
  }

  const props = event.properties ?? event.traits
  if (event.type !== 'alias' && !isPlainObject(props)) {
    throw new ValidationError('.properties', 'is not an object')
  }

  assertUserIdentity(event)
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
