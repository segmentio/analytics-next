import { ProcessSignal } from './process-signal'

export interface SignalsPluginSettings {
  enableDebugLogging?: boolean
  /**
   * Max number of signals in the default signal store
   */
  maxBufferSize?: number

  processSignal?: string | ProcessSignal
}
