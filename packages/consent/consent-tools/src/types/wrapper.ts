import type { CreateWrapperSettings } from './settings'

/**
 * first argument to AnalyticsBrowser.load
 */
export interface AnalyticsBrowserSettings {
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
  (options: CreateWrapperSettings): Wrapper
}

export interface Categories {
  [category: string]: boolean
}

export interface IntegrationCategoryMappings {
  [integrationName: string]: string[]
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
