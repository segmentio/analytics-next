import type { CorePlugin } from '@segment/analytics-core'
import type { DestinationMiddlewareFunction } from '../../plugins/middleware'
import type { Analytics } from '../analytics'
import type { Context } from '../context'

// enrichment - modifies the event. Enrichment can happen in parallel, by reducing all changes in the final event. Failures in this stage could halt event delivery.
// destination - runs in parallel at the end of the lifecycle. Cannot modify the event, can fail and not halt execution.
// utility - do not affect lifecycle. Should be run and executed once. Their `track/identify` calls don't really do anything. example

export interface Plugin extends CorePlugin<Context, Analytics> {}

export interface DestinationPlugin extends Plugin {
  addMiddleware: (...fns: DestinationMiddlewareFunction[]) => void
}

export type AnyBrowserPlugin = Plugin | DestinationPlugin
