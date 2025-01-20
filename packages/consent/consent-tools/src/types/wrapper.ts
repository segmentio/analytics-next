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
  disable?: boolean | ((cdnSettings: CDNSettings) => boolean)
  initialPageview?: boolean
}

/**
 * Underling analytics instance so it does not have a load method.
 * This type is neccessary because the final 'initialized' Analytics instance in `window.analytics` does not have a load method (ditto, new AnalyticsBrowser().instance)
 * This is compatible with one of the following interfaces: `Analytics`, `AnalyticsSnippet`, `AnalyticsBrowser`.
 */
export type MaybeInitializedAnalytics = {
  initialized?: boolean
} & OptionalField<AnyAnalytics, 'load'>

export interface SegmentEventStub {
  context: {
    consent?: {
      /**
       * @example { "CAT001": true }
       */
      categoryPreferences: {
        [category: string]: boolean
      }
    }
  }
}
/**
 * Note: we aren't importing from @segment/analytics-next in src code, because we don't want
 * to introduce a doependency on the analytics-next package, which would trigger errors for customers if they have skipLibCheck set to false (which is default).
 * @example { "Amplitude (Actions)":  { .... }}
 */
export interface SegmentIntegrations {
  [creationName: string]: any
}
export interface SourceMiddlewareParams {
  payload: {
    obj: SegmentEventStub
  }
  integrations?: SegmentIntegrations
  next: (payload: SourceMiddlewareParams['payload'] | null) => void
}

export type SourceMiddlewareFunction = (
  middleware: SourceMiddlewareParams
) => null | void | Promise<void | null>

export interface DestinationMiddlewareParams {
  payload: SourceMiddlewareParams['payload']
  next: SourceMiddlewareParams['next']
  /**
   * integration name
   * @example "Amplitude (Actions)"
   */
  integration: string
}

export type DestinationMiddlewareFunction = (
  middleware: DestinationMiddlewareParams
) => null | void | Promise<void | null>

/**
 * This interface is a stub of the actual Segment analytics instance.
 * Either `AnalyticsSnippet` _or_ `AnalyticsBrowser`.
 */
export interface AnyAnalytics {
  // Yes, the typing is strange (any | this resolves to 'any' -- ditto Function | any).
  // This is to documenting the strict type in the type signature, rather than use it.
  // internally, we can have stronger typing, but we don't want false positive TS errors in the public API
  // Again, we don't want to introduce a non-dev dependency on analytics-next
  addDestinationMiddleware(
    integrationName: string,
    middleware: Function | DestinationMiddlewareFunction
  ): any | this
  addSourceMiddleware(
    middleware: Function | SourceMiddlewareFunction
  ): any | this
  track(event: string, properties?: unknown, ...args: any[]): void
  page(): void

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

export interface CDNSettingsConsent {
  // all unique categories keys
  allCategories: string[]
  // where user has unmapped enabled destinations
  hasUnmappedDestinations: boolean
}

export interface CDNSettings {
  integrations: CDNSettingsIntegrations
  remotePlugins?: CDNSettingsRemotePlugin[]
  consentSettings?: CDNSettingsConsent
}

/**
 *CDN Settings Integrations object.
 * @example
 * { "Fullstory": {...}, "Braze Web Mode (Actions)": {...}}
 */
export interface CDNSettingsIntegrations {
  'Segment.io': Record<string, unknown>
  [integrationName: string]: Record<string, unknown>
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
