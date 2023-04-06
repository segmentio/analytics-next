import type { Plugin } from '../../core/plugin'
import type { Context } from '../../core/context'
import { validateEvent } from '@segment/analytics-core'

function validate(ctx: Context): Context {
  validateEvent(ctx.event)
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
