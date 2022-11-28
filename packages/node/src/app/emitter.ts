import { CoreEmitterContract, Emitter } from '@segment/analytics-core'
import type { SegmentEvent, Context } from './analytics-node'
import type { AnalyticsSettings } from './settings'

/**
 * Map of emitter event names to method args.
 */
type NodeEmitterEvents = CoreEmitterContract<Context> & {
  initialize: [AnalyticsSettings]
  call_after_close: [SegmentEvent] // any event that did not get dispatched due to close
  drained: []
}

export class NodeEmitter extends Emitter<NodeEmitterEvents> {}
