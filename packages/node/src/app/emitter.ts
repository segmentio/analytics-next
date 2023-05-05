import { CoreEmitterContract, Emitter } from '@customerio/cdp-analytics-core'
import { Context } from './context'
import type { AnalyticsSettings } from './settings'
import { CustomerioEvent } from './types'

/**
 * Map of emitter event names to method args.
 */
export type NodeEmitterEvents = CoreEmitterContract<Context> & {
  initialize: [AnalyticsSettings]
  call_after_close: [CustomerioEvent] // any event that did not get dispatched due to close
  http_request: [
    {
      url: string
      method: string
      headers: Record<string, string>
      body: string
    }
  ]
  drained: []
}

export class NodeEmitter extends Emitter<NodeEmitterEvents> { }
