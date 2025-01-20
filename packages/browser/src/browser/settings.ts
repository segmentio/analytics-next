/**
 * These settings will be exposed via the public API
 */
import { Plan } from '../core/events'
import { MetricsOptions } from '../core/stats/remote-metrics'
import { ClassicIntegrationSource } from '../plugins/ajs-destination/types'
import { PluginFactory, RemotePlugin } from '../plugins/remote-loader'
import { Plugin } from '../core/plugin'
import { RoutingRule } from '../plugins/routing-middleware'
import { CookieOptions, StorageSettings } from '../core/storage'
import { UserOptions } from '../core/user'
import { HighEntropyHint } from '../lib/client-hints/interfaces'
import { IntegrationsOptions } from '@segment/analytics-core'
import { DeliveryStrategy } from '../plugins/segmentio/shared-dispatcher'

interface VersionSettings {
  version?: string
  override?: string
  componentTypes?: ('browser' | 'android' | 'ios' | 'server')[]
}

export interface RemoteIntegrationSettings {
  /* @deprecated - This does not indicate browser types anymore */
  type?: string

  versionSettings?: VersionSettings
  /**
   * We know if an integration is device mode if it has `bundlingStatus: 'bundled'` and the `browser` componentType in `versionSettings`.
   * History: The term 'bundle' is left over from before action destinations, when a device mode destinations were 'bundled' in a custom bundle for every analytics.js source.
   */
  bundlingStatus?: 'bundled' | 'unbundled'

  /**
   * Consent settings for the integration
   */
  consentSettings?: {
    /**
     * Consent categories for the integration
     * @example ["CAT001", "CAT002"]
     */
    categories: string[]
  }

  // any extra unknown settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface RemoteSegmentIOIntegrationSettings
  extends RemoteIntegrationSettings {
  /**
   * Segment write key
   */
  apiKey: string

  /**
   * Whether or not offline events are stored and retried.
   *
   * Originally, each plugin was concieved to use global retry logic (e.g. throwing magic errors would result in retries),
   * but this was not really used and is no longer encouraged. Instead, we favor of per-plugin retry logic, since it's confusing to have multiple levels of retries, and most device mode destinations contain their own retry behavior.
   * The segmentio plugin itself has its own internal retry queue and is not affected by this setting.
   *
   * @default true
   */
  retryQueue?: boolean

  /**
   * Host of the segment cdn - this may need to be manually enabled on the source.
   * @default 'api.segment.io/v1'
   */
  apiHost?: string
  addBundledMetadata?: boolean
  unbundledIntegrations?: string[]
  bundledConfigIds?: string[]
  unbundledConfigIds?: string[]
  maybeBundledConfigIds?: Record<string, string[]>
}

/**
 * The remote settings object for a source, typically fetched from the Segment CDN.
 * Warning: this is an *unstable* object.
 */
export interface CDNSettings {
  integrations: {
    'Segment.io': RemoteSegmentIOIntegrationSettings
    [creationName: string]: RemoteIntegrationSettings
  }

  middlewareSettings?: {
    routingRules: RoutingRule[]
  }

  enabledMiddleware?: Record<string, boolean>
  metrics?: MetricsOptions

  plan?: Plan

  legacyVideoPluginsEnabled?: boolean

  remotePlugins?: RemotePlugin[]

  /**
   * Top level consent settings
   */
  consentSettings?: {
    /**
     * All unique consent categories for enabled destinations.
     * There can be categories in this array that are important for consent that are not included in any integration  (e.g. 2 cloud mode categories).
     * @example ["Analytics", "Advertising", "CAT001"]
     */
    allCategories: string[]

    /**
     * Whether or not there are any unmapped destinations for enabled destinations.
     */
    hasUnmappedDestinations: boolean
  }
  /**
   * Settings for edge function. Used for signals.
   */
  edgeFunction?: // this is technically non-nullable according to ajs-renderer atm, but making it optional because it's strange API choice, and we might want to change it.
  | {
        /**
         * The URL of the edge function (.js file).
         * @example 'https://cdn.edgefn.segment.com/MY-WRITEKEY/foo.js',
         */
        downloadURL: string
        /**
         * The version of the edge function
         * @example 1
         */
        version: number
      }
    | {}

  /**
   * Settings for auto instrumentation
   */
  autoInstrumentationSettings?: {
    sampleRate: number
  }

  /**
   * Allow misc settings to be passed through, but
   */
  [key: string]: unknown
}

export interface BrowserIntegrationsOptions extends IntegrationsOptions {
  'Segment.io'?: // subset of the SegmentSettings, since we don't want to expose all of them to the user
  | {
        apiHost?: string
        protocol?: 'http' | 'https'
        deliveryStrategy?: DeliveryStrategy
      }
    | boolean
}

/**
 * These are the settings that are the first argument to the npm installed plugin.
 */
export interface AnalyticsBrowserSettings {
  // TODO: Having two different configuration patterns for snippet and npm is confusing.
  writeKey: string
  /**
   * The settings for the Segment Source.
   * If provided, `AnalyticsBrowser` will not fetch remote settings
   * for the source.
   */
  cdnSettings?: CDNSettings
  /**
   * If provided, will override the default Segment CDN (https://cdn.segment.com) for this application.
   */
  cdnURL?: string
  /**
   * Plugins or npm-installed action destinations
   */
  plugins?: (Plugin | PluginFactory)[]
  /**
   * npm-installed classic destinations
   */
  classicIntegrations?: ClassicIntegrationSource[]
}

/**
 * The settings that are used to configure the analytics instance
 */
export interface AnalyticsSettings {
  writeKey: string
  cdnSettings?: CDNSettings
  cdnURL?: string
}

export interface InitOptions {
  /**
   * Disables storing any data on the client-side via cookies or localstorage.
   * Defaults to `false`.
   *
   */
  disableClientPersistence?: boolean
  /**
   * Disables automatically converting ISO string event properties into Dates.
   * ISO string to Date conversions occur right before sending events to a classic device mode integration,
   * after any destination middleware have been ran.
   * Defaults to `false`.
   */
  disableAutoISOConversion?: boolean
  initialPageview?: boolean
  cookie?: CookieOptions
  storage?: StorageSettings
  user?: UserOptions
  group?: UserOptions
  integrations?: BrowserIntegrationsOptions
  plan?: Plan
  retryQueue?: boolean
  obfuscate?: boolean
  /**
   * This callback allows you to update/mutate CDN Settings.
   * This is called directly after settings are fetched from the CDN.
   * @internal
   */
  updateCDNSettings?: (unstableCDNSettings: CDNSettings) => CDNSettings
  /**
   * Disables or sets constraints on processing of query string parameters
   */
  useQueryString?:
    | boolean
    | {
        aid?: RegExp
        uid?: RegExp
      }
  /**
   * Array of high entropy Client Hints to request. These may be rejected by the user agent - only required hints should be requested.
   */
  highEntropyValuesClientHints?: HighEntropyHint[]
  /**
   * When using the snippet, this is the key that points to the global analytics instance (e.g. window.analytics).
   * default: analytics
   */
  globalAnalyticsKey?: string

  /**
   * Disable sending any data to Segment's servers. All emitted events and API calls (including .ready()), will be no-ops, and no cookies or localstorage will be used.
   *
   * @example
   * ```ts
   * disable: process.env.NODE_ENV === 'test'
   * ```
   */
  disable?:
    | boolean
    | ((unstableCDNSettings: CDNSettings) => boolean | Promise<boolean>)
}
