import { EventFactory } from '@segment/analytics-core'
import { createMessageId } from '../lib/get-message-id'
import { SegmentEvent } from './types'

// use declaration merging to downcast CoreSegmentEvent without adding any runtime code.
// if/when we decide to add an actual implementation (change context is some node specific way), we can remove this
export interface NodeEventFactory {
  alias(...args: Parameters<EventFactory['alias']>): SegmentEvent
  group(...args: Parameters<EventFactory['group']>): SegmentEvent
  identify(...args: Parameters<EventFactory['identify']>): SegmentEvent
  track(...args: Parameters<EventFactory['track']>): SegmentEvent
  page(...args: Parameters<EventFactory['page']>): SegmentEvent
  screen(...args: Parameters<EventFactory['screen']>): SegmentEvent
}

export class NodeEventFactory extends EventFactory {
  constructor() {
    super({ createMessageId })
  }
}
