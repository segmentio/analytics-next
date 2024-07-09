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
   * @default false
   */
  enableDebugLogging?: boolean

  /**
   * Disable redaction of signals
   * @default false
   */
  disableSignalsRedaction?: boolean

  /**
   * Override signals API host
   * @default signals.segment.io/v1
   */
  apiHost?: string

  /**
   * Override edge function host
   * @default cdn.edgefn.segment.com
   */
  functionHost?: string

  /**
   * How many signals to flush at once when sending to the signals API
   * @default 5
   */
  flushAt?: number

  /**
   * How many ms to wait before flushing signals to the API
   * @default 2000
   */
  flushInterval?: number
}
