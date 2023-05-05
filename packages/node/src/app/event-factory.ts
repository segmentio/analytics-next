import { EventFactory } from '@customerio/cdp-analytics-core'
import { createMessageId } from '../lib/get-message-id'
import { CustomerioEvent } from './types'

// use declaration merging to downcast CoreCustomerioEvent without adding any runtime code.
// if/when we decide to add an actual implementation to NodeEventFactory that actually changes the event shape, we can remove this.
export interface NodeEventFactory {
  alias(...args: Parameters<EventFactory['alias']>): CustomerioEvent
  group(...args: Parameters<EventFactory['group']>): CustomerioEvent
  identify(...args: Parameters<EventFactory['identify']>): CustomerioEvent
  track(...args: Parameters<EventFactory['track']>): CustomerioEvent
  page(...args: Parameters<EventFactory['page']>): CustomerioEvent
  screen(...args: Parameters<EventFactory['screen']>): CustomerioEvent
}

export class NodeEventFactory extends EventFactory {
  constructor() {
    super({ createMessageId })
  }
}
