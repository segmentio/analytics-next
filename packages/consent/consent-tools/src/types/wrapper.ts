import { OptionalField } from '../utils'
import type { CreateWrapperSettings } from './settings'

export interface AnalyticsBrowserSettings {
  writeKey: string
  cdnURL?: string
  cdnSettings?: CDNSettings
}

/**
 * 2nd arg to AnalyticsBrowser.load / analytics
 */
export interface InitOptions {
  updateCDNSettings?(cdnSettings: CDNSettings): CDNSettings
}

/**
 * Underling analytics instance so it does not have a load method.
 * This type is neccessary because the final 'initialized' Analytics instance in `window.analytics` does not have a load method (ditto, new AnalyticsBrowser().instance)
 * This is compatible with one of the following interfaces: `Analytics`, `AnalyticsSnippet`, `AnalyticsBrowser`.
 */
export type MaybeInitializedAnalytics = {
  initialized?: boolean
} & OptionalField<AnyAnalytics, 'load'>

/**
 * This interface is a stub of the actual Segment analytics instance.
 * Either `AnalyticsSnippet` _or_ `AnalyticsBrowser`.
 */
export interface AnyAnalytics {
  addSourceMiddleware(...args: any[]): any
  on(event: 'initialize', callback: (cdnSettings: CDNSettings) => void): void
  track(event: string, properties?: unknown, ...args: any[]): void

  /**
   * This interface is meant to be compatible with both the snippet (`analytics.load`)
   * and the npm lib (`AnalyticsBrowser.load`)
   */
  load(
    writeKeyOrSettings: AnalyticsBrowserSettings | string,
    options?: InitOptions
  ): void
}

/**
 * This function modifies an analytics instance to add consent management.
 * This is an analytics instance (either window.analytics, new AnalyticsBrowser(), or the instance returned by `AnalyticsBrowser.load({...})`
 **/
// Why type this as 'object' rather than 'AnyAnalytics'? IMO, the chance of a false positive is much higher than the chance that someone will pass in an object that is not an analytics instance.
// We have an assertion function that throws an error if the analytics instance is not compatible.
export type Wrapper<Analytics extends AnyAnalytics> = (
  analyticsInstance: Analytics
) => Analytics

/**
 * Create a function which wraps analytics instances to add consent management.
 */
export type CreateWrapper<Analytics extends AnyAnalytics> = (
  settings: CreateWrapperSettings
) => Wrapper<Analytics>

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
