import { EventFactory } from '@segment/analytics-core'
import { getMessageId } from './get-message-id'

export const createNodeEventFactory = () =>
  new EventFactory({
    getMessageId,
  })
