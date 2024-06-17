import { SignalsRuntime } from '../core/processor/signals-runtime'
import { Signal } from './signals'

/**
 * Types for the signals runtime
 */
export interface AnalyticsRuntimePublicApi {
  track: (...args: any[]) => void
  identify: (...args: any[]) => void
  alias: (...args: any[]) => void
  group: (...args: any[]) => void
  page: (...args: any[]) => void
  screen: (...args: any[]) => void
}
export interface ProcessSignal {
  (
    signal: Signal,
    {
      analytics,
      Signals,
    }: { analytics: AnalyticsRuntimePublicApi; Signals: SignalsRuntime }
  ): void
}
