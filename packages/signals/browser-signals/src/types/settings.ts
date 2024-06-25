import { ProcessSignal } from './process-signal'

export interface SignalsPluginSettingsConfig {
  /**
   * Max number of signals in the default signal store
   */
  maxBufferSize?: number

  /**
   * Override the default signal processing function from the edge function. If this is set, the edge function will not be used.
   */
  processSignal?: string | ProcessSignal

  /**
   * Add console debug logging
   */
  enableDebugLogging?: boolean

  /**
   * Override signals API host
   * @default signals.segment.io/v1
   */
  apiHost?: string

  /**
   * Override edge function host
   */
  functionHost?: string
}
