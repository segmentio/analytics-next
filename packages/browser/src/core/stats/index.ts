import { CoreStats } from '@segment/analytics-core'
import type { RemoteMetrics } from './remote-metrics'

export class Stats extends CoreStats {
  constructor(private _remoteMetrics?: RemoteMetrics) {
    super()
  }
  increment(metric: string, by?: number, tags?: string[]): void {
    super.increment(metric, by, tags)
    this._remoteMetrics?.increment(metric, tags ?? [])
  }
}
