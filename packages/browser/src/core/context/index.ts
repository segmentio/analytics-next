import {
  CoreContext,
  ContextCancelation,
  ContextFailedDelivery,
  SerializedContext,
  CancelationOptions,
} from '@segment/analytics-core'
import { SegmentEvent } from '../events/interfaces'
import { Stats } from '../stats'
import { MetricsOptions, RemoteMetrics } from '../stats/remote-metrics'

let _remoteMetrics: RemoteMetrics

export class Context extends CoreContext<SegmentEvent> {
  static override system() {
    return new this({ type: 'track', event: 'system' })
  }
  static initRemoteMetrics(options?: MetricsOptions) {
    _remoteMetrics = new RemoteMetrics(options)
  }
  constructor(event: SegmentEvent, id?: string) {
    super(event, id, new Stats(_remoteMetrics))
  }
}
export { ContextCancelation }
export type { ContextFailedDelivery, SerializedContext, CancelationOptions }
