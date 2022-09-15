import { CoreContext, CorePlugin, validateEvent } from '@segment/analytics-core'

function validate(ctx: CoreContext): CoreContext {
  validateEvent(ctx?.event)
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
