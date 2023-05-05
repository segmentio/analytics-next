import {
  CoreContext,
  ContextCancelation,
  ContextFailedDelivery,
  SerializedContext,
  CancelationOptions,
} from '@customerio/cdp-analytics-core'
import { CustomerioEvent } from '../events/interfaces'
import { Stats } from '../stats'

export class Context extends CoreContext<CustomerioEvent> {
  static override system() {
    return new this({ type: 'track', event: 'system' })
  }
  constructor(event: CustomerioEvent, id?: string) {
    super(event, id, new Stats())
  }
}

export { ContextCancelation }
export type { ContextFailedDelivery, SerializedContext, CancelationOptions }
