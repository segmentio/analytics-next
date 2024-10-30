import {
  Signal,
  WebRuntimeConstants,
  SignalsRuntime,
} from '@segment/analytics-signals-runtime'

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

export type ProcessSignalScope = {
  analytics: AnalyticsRuntimePublicApi
  signals: SignalsRuntime
} & typeof WebRuntimeConstants

export interface ProcessSignal {
  (signal: Signal, ctx: ProcessSignalScope): void
}
