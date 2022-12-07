import { EventFactory } from '@segment/analytics-core'
import { createMessageId } from '../lib/get-message-id'

export class NodeEventFactory extends EventFactory {
  constructor() {
    super({ createMessageId })
  }
}
