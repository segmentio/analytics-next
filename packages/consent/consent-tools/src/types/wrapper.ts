import { LoadContext } from '../domain/load-cancellation'

/**
 * first argument to AnalyticsBrowser.load
 */
export interface Settings {
  writeKey: string
  cdnURL?: string
  cdnSettings?: CDNSettings
}

/**
 * 2nd arg to AnalyticsBrowser.load / analytics
 */
export interface InitOptions {
  updateCDNSettings(cdnSettings: CDNSettings): CDNSettings
}

/**
 * This interface is a stub of the actual Segment analytics instance.
 * This can be either:
 * - window.analytics (i.e `AnalyticsSnippet`)
 * - the instance returned by `AnalyticsBrowser.load({...})`
 * - the instance created by `new AnalyticsBrowser(...)`
 */
export interface AnyAnalytics {
  addSourceMiddleware(...args: any[]): any
  on(event: 'initialize', callback: (settings: CDNSettings) => void): void
  /**
   * Either window.analytics.load(...) OR AnalyticsBrowser.load(...)
   */
  load(
    writeKeyOrSettings: any,
    /** See analytics-next function signature for more information. */
    options?: InitOptions
  ): any
}

/**
 * This function returns a "wrapped" version of analytics.
 */
export interface Wrapper {
  // Returns void rather than analytics to emphasize that this function replaces the .load function of the underlying instance.
  (analytics: AnyAnalytics): void
}

/**
 * This function returns a function which returns a "wrapped" version of analytics
 */
export interface CreateWrapper {
  (options: CreateWrapperOptions): Wrapper
}

export interface Categories {
  [category: string]: boolean
}

export interface IntegrationCategoryMappings {
  [integrationName: string]: string[]
}

/**
 * Consent wrapper function configuration
 */
export interface CreateWrapperOptions {
  /**
   * Wait until this function resolves/returns before loading analytics.
   * This function should return a list of initial categories.
   * If this function returns `undefined`, `getCategories()` function will be called to get initial categories.
   **/
  shouldLoad?: (
    context: LoadContext
  ) => Categories | void | Promise<Categories | void>

  /**
   * Fetch the categories which stamp every event. Called each time a new Segment event is dispatched.
   **/
  getCategories: () => Categories | Promise<Categories>

  /**
   * This permanently disables any consent requirement (i.e device mode gating, event pref stamping).
   * Called on wrapper initialization. **shouldLoad will never be called**
   **/
  disableConsentRequirement?: () => boolean | Promise<boolean>

  /**
   * Disable the Segment analytics SDK completely. analytics.load() will have no effect.
   * .track / .identify etc calls should not throw any errors, but analytics settings will never be fetched and no events will be sent to Segment.
   * Called on wrapper initialization. This can be useful in dev environments (e.g. 'devMode').
   * **shouldLoad will never be called**
   **/
  disableSegmentInitialization?: () => boolean | Promise<boolean>

  /**
   * A callback that should be passed to onConsentChanged. This is neccessary for sending automatic "consent changed" events to segment (Future behavior)
   **/
  registerConsentChanged?: (callback: (categories: Categories) => void) => void

  /**
   * Object that maps `integrationName -> categories`. Typically, this is not needed, as this data comes from the CDN and is attached to each integration.
   * However, it may be desirable to hardcode these mappings (e.g, for testing).
   * @example
   * {"Braze Web Mode (Actions)": ["Advertising", "Analytics"]
   */
  integrationCategoryMappings?: IntegrationCategoryMappings

  /**
   * Predicate function to override default logic around whether or not to load an integration.
   * @default
   * ```ts
   * // consent if user consents to at least one category defined in the integration
   * (categories, consentedCategories, _info) => {
   *    if (!categories.length) return true
   *    return categories.some((c) => consentedCategories[c])
   * }
   * ```
   *
   * @example -
   * ```ts
   * (categories, consentedCategories, _info) => {
   * // consent if user consents to _all_ categories defined in the integration
   *    if (!categories.length) return true
   *    return categories.every((c) => consentedCategories[c])
   * }
   * ```
   *
   * @example
   * ```ts
   * // count consent as usual, but always disable a particular plugin
   * (categories, consentedCategories, { creationName }) => {
   *    if (creationName === 'FullStory') return false
   *    if (!categories.length) return true
   *    return categories.some((c) => consentedCategories[c])
   * }
   * ```
   */
  shouldEnableIntegration?: (
    integrationCategories: string[],
    userConsentedCategories: Categories,
    integrationInfo: Pick<
      CDNSettingsRemotePlugin,
      'creationName' | 'libraryName'
    >
  ) => boolean
}

export interface CDNSettings {
  integrations: CDNSettingsIntegrations
  remotePlugins?: CDNSettingsRemotePlugin[]
  consentSettings?: {
    // all unique categories keys
    allCategories: string[]
  }
}

/**
 *CDN Settings Integrations object.
 * @example
 * { "Fullstory": {...}, "Braze Web Mode (Actions)": {...}}
 */
export interface CDNSettingsIntegrations {
  [integrationName: string]: { [key: string]: any }
}

export interface CDNSettingsRemotePlugin {
  /** The creation name of the remote plugin
   * @example 'Actions Amplitude',
   */
  creationName: string
  /** The name of the remote plugin
   * @example 'Amplitude (Actions)'
   */
  name: string
  /** The url of the javascript file to load
   * @example https://cdn.segment.com/next-integrations/actions/amplitude-plugins/67621cf169443c119b.js
   */
  url: string
  /** The UMD/global name the plugin uses. Plugins are expected to exist here with the `PluginFactory` method signature
   * @example  'amplitude-pluginsDestination',
   */
  libraryName: string
  /** The settings related to this plugin.
   * @example
   * ```js
   * versionSettings: { componentTypes: [] },
   * subscriptions: [{ id: 'nEx215jtwHt4kJmFXSmHMd', name: 'Browser Session Tracking'...}]
   * ```
   */
  // using "any" here because otherwise this conflict with the JSONValue type inside of analytics-next, and we're not sharing types ATM.
  settings: any
}
