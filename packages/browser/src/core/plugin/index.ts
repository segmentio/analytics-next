import type { CorePlugin } from '@segment/analytics-core'
import type { DestinationMiddlewareFunction } from '../../plugins/middleware'
import type { Analytics } from '../analytics'
import type { Context } from '../context'

export interface Plugin extends CorePlugin<Context, Analytics> {}

export interface InternalPluginWithAddMiddleware extends Plugin {
  addMiddleware: (...fns: DestinationMiddlewareFunction[]) => void
}

export interface InternalDestinationPluginWithAddMiddleware
  extends InternalPluginWithAddMiddleware {
  type: 'destination'
}

export const isDestinationPluginWithAddMiddleware = (
  plugin: Plugin
): plugin is InternalDestinationPluginWithAddMiddleware => {
  // FYI: segment's plugin does not currently have an 'addMiddleware' method
  return 'addMiddleware' in plugin && plugin.type === 'destination'
}
