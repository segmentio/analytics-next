import { EventFactory } from '@segment/analytics-core'
import { createMessageId } from './get-message-id'

export const createNodeEventFactory = () =>
  new EventFactory({
    createMessageId,
  })
