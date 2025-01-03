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
   * Enable ingestion of signals
   */
  enableSignalsIngestion?: boolean

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

  /**
   * Choose between sessionStorage and indexDB.
   * IndexDB is more performant and has no size requirements, but has the security caveat that signals can be retained across sessions (cleared on new session, but still technically accessible), and only cleared at the beginning of a new session.
   * SessionStorage is cleared on tab close.
   *
   * @default 'indexDB'
   */
  signalStorageType?: 'session' | 'indexDB' | undefined

  /**
   * Custom selectors that map to components that should be observed for attribute changes (if the default list is not sufficient)
   * @example [`[id="bar"]`, `.foo`]
   */
  mutationGenExtraSelectors?: string[]
  /**
   * @example
   * // add a role to the roles
   * (defaultRoles) => [...defaultRoles, 'grid']
   * // remove a role from the roles
   * (defaultRoles) => defaultRoles.filter(role => role !== 'grid')
   */
  mutationGenObservedRoles?: (defaultRoles: string[]) => string[]
  /**
   * @example
   * // add a new tag to the tags
   * (defaultTags) => [...defaultTags, 'video']
   * // remove a tag from the tags
   * (defaultTags) => defaultTags.filter(tag => tag.toLowerCase() !== 'video')
   */
  mutationGenObservedTags?: (defaultTags: string[]) => string[]
  /**
   * How often to poll the DOM for new elements to observe (ms)
   * @default 400
   */
  mutationGenPollInterval?: number
  /**
   *
   * Which attributes to observe for changes on the observed elements. This is used for MutationObserver.
   * @example
   * // add a new attribute to watch for changes
   * (defaultAttributes) => [...defaultAttributes, 'aria-label']
   * // remove an attribute from the list of attributes to watch for changes
   * (defaultAttributes) => defaultAttributes.filter(attr => attr.toLowerCase() !== 'aria-selected')
   */
  mutationGenObservedAttributes?: (defaultAttributes: string[]) => string[]
}

export type RegexLike = RegExp | string

export interface SignalStorage<Signal = any> {
  getAll(): Promise<Signal[]> | Signal[]
  add(value: Signal): Promise<void> | void
  clear(): void
}
