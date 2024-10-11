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
   * Enables signals debug mode (turns off redaction, enables ingestion)
   * @default false
   */
  enableSignalsDebug?: boolean

  /**
   * If signals ingestion is enabled/disabled
   */
  signalsIngestion?: boolean

  /**
   * Percentage of sessions that should be ingested
   */
  sampleRate?: number

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

  /**
   * Allow network requests for URLs that match the specified regex.
   * Same domain signals will be automatically included, unless `networkSignalsAllowSameDomain` is `false`.
   * @example  new RegExp("api.foo.com|api.bar.com")  // match api.foo.com/bar and api.foo.com/baz and api.bar.com/baz
   * @example  new RegExp("api.foo.com/bar$") // match api.foo.com/bar but NOT api.foo.com/baz
   * @example  "api.foo.com" // match api.foo.com/bar and api.foo.com/baz
   */
  networkSignalsAllowList?: RegexLike[] | undefined
  networkSignalsDisallowList?: RegexLike[] | undefined

  /**
   * Allow network requests if originated from the same domain
   * @default true
   */
  networkSignalsAllowSameDomain?: boolean | undefined

  /**
   * Custom signal storage implementation
   */
  signalStorage?: SignalStorage | undefined
}

export type RegexLike = RegExp | string

export interface SignalStorage<Signal = any> {
  getAll(): Promise<Signal[]> | Signal[]
  add(value: Signal): Promise<void> | void
  clear(): void
}
