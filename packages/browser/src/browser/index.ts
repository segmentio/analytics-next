import { getProcessEnv } from '../lib/get-process-env'
import { getCDN, setGlobalCDNUrl } from '../lib/parse-cdn'

import { fetch } from '../lib/fetch'
import { Analytics, NullAnalytics, InitOptions } from '../core/analytics'
import { Context } from '../core/context'
import { Plan } from '../core/events'
import { Plugin } from '../core/plugin'
import { MetricsOptions } from '../core/stats/remote-metrics'
import { mergedOptions } from '../lib/merged-options'
import { createDeferred } from '@segment/analytics-generic-utils'
import { envEnrichment } from '../plugins/env-enrichment'
import {
  PluginFactory,
  remoteLoader,
  RemotePlugin,
} from '../plugins/remote-loader'
import type { RoutingRule } from '../plugins/routing-middleware'
import { segmentio, SegmentioSettings } from '../plugins/segmentio'
import {
  AnalyticsBuffered,
  PreInitMethodCallBuffer,
  flushAnalyticsCallsInNewTask,
  flushAddSourceMiddleware,
  flushSetAnonymousID,
  flushOn,
  PreInitMethodCall,
  flushRegister,
} from '../core/buffer'
import { ClassicIntegrationSource } from '../plugins/ajs-destination/types'
import { attachInspector } from '../core/inspector'
import { Stats } from '../core/stats'
import { setGlobalAnalyticsKey } from '../lib/global-analytics-helper'

export interface RemoteIntegrationSettings {
  /* @deprecated - This does not indicate browser types anymore */
  type?: string

  versionSettings?: {
    version?: string
    override?: string
    componentTypes?: ('browser' | 'android' | 'ios' | 'server')[]
  }

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

  // Segment.io specific
  retryQueue?: boolean

  // any extra unknown settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/**
 * The remote settings object for a source, typically fetched from the Segment CDN.
 * Warning: this is an *unstable* object.
 */
export interface CDNSettings {
  integrations: {
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
}

export interface AnalyticsBrowserSettings {
  writeKey: string
  /**
   * The settings for the Segment Source.
   * If provided, `AnalyticsBrowser` will not fetch remote settings
   * for the source.
   */
  cdnSettings?: CDNSettings & Record<string, unknown>
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

export function loadCDNSettings(
  writeKey: string,
  baseUrl: string
): Promise<CDNSettings> {
  return fetch(`${baseUrl}/v1/projects/${writeKey}/settings`)
    .then((res) => {
      if (!res.ok) {
        return res.text().then((errorResponseMessage) => {
          throw new Error(errorResponseMessage)
        })
      }
      return res.json()
    })
    .catch((err) => {
      console.error(err.message)
      throw err
    })
}

function hasLegacyDestinations(settings: CDNSettings): boolean {
  return (
    getProcessEnv().NODE_ENV !== 'test' &&
    // just one integration means segmentio
    Object.keys(settings.integrations).length > 1
  )
}

function hasTsubMiddleware(settings: CDNSettings): boolean {
  return (
    getProcessEnv().NODE_ENV !== 'test' &&
    (settings.middlewareSettings?.routingRules?.length ?? 0) > 0
  )
}

/**
 * With AJS classic, we allow users to call setAnonymousId before the library initialization.
 * This is important because some of the destinations will use the anonymousId during the initialization,
 * and if we set anonId afterwards, that wouldn’t impact the destination.
 *
 * Also Ensures events can be registered before library initialization.
 * This is important so users can register to 'initialize' and any events that may fire early during setup.
 */
function flushPreBuffer(
  analytics: Analytics,
  buffer: PreInitMethodCallBuffer
): void {
  flushSetAnonymousID(analytics, buffer)
  flushOn(analytics, buffer)
}

/**
 * Finish flushing buffer and cleanup.
 */
async function flushFinalBuffer(
  analytics: Analytics,
  buffer: PreInitMethodCallBuffer
): Promise<void> {
  // Call popSnippetWindowBuffer before each flush task since there may be
  // analytics calls during async function calls.
  await flushAddSourceMiddleware(analytics, buffer)
  flushAnalyticsCallsInNewTask(analytics, buffer)
}

async function registerPlugins(
  writeKey: string,
  cdnSettings: CDNSettings,
  analytics: Analytics,
  options: InitOptions,
  pluginLikes: (Plugin | PluginFactory)[] = [],
  legacyIntegrationSources: ClassicIntegrationSource[],
  preInitBuffer: PreInitMethodCallBuffer
): Promise<Context> {
  flushPreBuffer(analytics, preInitBuffer)
  const pluginsFromSettings = pluginLikes?.filter(
    (pluginLike) => typeof pluginLike === 'object'
  ) as Plugin[]

  const pluginSources = pluginLikes?.filter(
    (pluginLike) =>
      typeof pluginLike === 'function' &&
      typeof pluginLike.pluginName === 'string'
  ) as PluginFactory[]

  const tsubMiddleware = hasTsubMiddleware(cdnSettings)
    ? await import(
        /* webpackChunkName: "tsub-middleware" */ '../plugins/routing-middleware'
      ).then((mod) => {
        return mod.tsubMiddleware(cdnSettings.middlewareSettings!.routingRules)
      })
    : undefined

  const legacyDestinations =
    hasLegacyDestinations(cdnSettings) || legacyIntegrationSources.length > 0
      ? await import(
          /* webpackChunkName: "ajs-destination" */ '../plugins/ajs-destination'
        ).then((mod) => {
          return mod.ajsDestinations(
            writeKey,
            cdnSettings,
            analytics.integrations,
            options,
            tsubMiddleware,
            legacyIntegrationSources
          )
        })
      : []

  if (cdnSettings.legacyVideoPluginsEnabled) {
    await import(
      /* webpackChunkName: "legacyVideos" */ '../plugins/legacy-video-plugins'
    ).then((mod) => {
      return mod.loadLegacyVideoPlugins(analytics)
    })
  }

  const schemaFilter = options.plan?.track
    ? await import(
        /* webpackChunkName: "schemaFilter" */ '../plugins/schema-filter'
      ).then((mod) => {
        return mod.schemaFilter(options.plan?.track, cdnSettings)
      })
    : undefined

  const mergedSettings = mergedOptions(cdnSettings, options)
  const remotePlugins = await remoteLoader(
    cdnSettings,
    analytics.integrations,
    mergedSettings,
    options,
    tsubMiddleware,
    pluginSources
  ).catch(() => [])

  const basePlugins = [envEnrichment, ...legacyDestinations, ...remotePlugins]

  if (schemaFilter) {
    basePlugins.push(schemaFilter)
  }

  const shouldIgnoreSegmentio =
    (options.integrations?.All === false &&
      !options.integrations['Segment.io']) ||
    (options.integrations && options.integrations['Segment.io'] === false)

  if (!shouldIgnoreSegmentio) {
    basePlugins.push(
      await segmentio(
        analytics,
        mergedSettings['Segment.io'] as SegmentioSettings,
        cdnSettings.integrations
      )
    )
  }

  // order is important here, (for example, if there are multiple enrichment plugins, the last registered plugin will have access to the last context.)
  const ctx = await analytics.register(
    // register 'core' plugins and those via destinations
    ...basePlugins,
    // register user-defined plugins passed into AnalyticsBrowser.load({ plugins: [plugin1, plugin2] }) -- relevant to npm-only
    ...pluginsFromSettings
  )
  // register user-defined plugins registered via analytics.register()
  await flushRegister(analytics, preInitBuffer)

  if (
    Object.entries(cdnSettings.enabledMiddleware ?? {}).some(
      ([, enabled]) => enabled
    )
  ) {
    await import(
      /* webpackChunkName: "remoteMiddleware" */ '../plugins/remote-middleware'
    ).then(async ({ remoteMiddlewares }) => {
      const middleware = await remoteMiddlewares(
        ctx,
        cdnSettings,
        options.obfuscate
      )
      const promises = middleware.map((mdw) =>
        analytics.addSourceMiddleware(mdw)
      )
      return Promise.all(promises)
    })
  }

  return ctx
}

async function loadAnalytics(
  settings: AnalyticsBrowserSettings,
  options: InitOptions = {},
  preInitBuffer: PreInitMethodCallBuffer
): Promise<[Analytics, Context]> {
  // return no-op analytics instance if disabled
  if (options.disable === true) {
    return [new NullAnalytics(), Context.system()]
  }

  if (options.globalAnalyticsKey)
    setGlobalAnalyticsKey(options.globalAnalyticsKey)
  // this is an ugly side-effect, but it's for the benefits of the plugins that get their cdn via getCDN()
  if (settings.cdnURL) setGlobalCDNUrl(settings.cdnURL)

  if (options.initialPageview) {
    // capture the page context early, so it's always up-to-date
    preInitBuffer.add(new PreInitMethodCall('page', []))
  }

  const cdnURL = settings.cdnURL ?? getCDN()
  let cdnSettings =
    settings.cdnSettings ?? (await loadCDNSettings(settings.writeKey, cdnURL))

  if (options.updateCDNSettings) {
    cdnSettings = options.updateCDNSettings(cdnSettings)
  }

  // if options.disable is a function, we allow user to disable analytics based on CDN Settings
  if (typeof options.disable === 'function') {
    const disabled = await options.disable(cdnSettings)
    if (disabled) {
      return [new NullAnalytics(), Context.system()]
    }
  }

  const retryQueue: boolean =
    cdnSettings.integrations['Segment.io']?.retryQueue ?? true

  options = {
    retryQueue,
    ...options,
  }

  const analytics = new Analytics({ ...settings, cdnSettings, cdnURL }, options)

  attachInspector(analytics)

  const plugins = settings.plugins ?? []

  const classicIntegrations = settings.classicIntegrations ?? []

  const segmentLoadOptions = options.integrations?.['Segment.io'] as
    | SegmentioSettings
    | undefined

  Stats.initRemoteMetrics({
    ...cdnSettings.metrics,
    host: segmentLoadOptions?.apiHost ?? cdnSettings.metrics?.host,
    protocol: segmentLoadOptions?.protocol,
  })

  const ctx = await registerPlugins(
    settings.writeKey,
    cdnSettings,
    analytics,
    options,
    plugins,
    classicIntegrations,
    preInitBuffer
  )

  const search = window.location.search ?? ''
  const hash = window.location.hash ?? ''

  const term = search.length ? search : hash.replace(/(?=#).*(?=\?)/, '')

  if (term.includes('ajs_')) {
    await analytics.queryString(term).catch(console.error)
  }

  analytics.initialized = true
  analytics.emit('initialize', settings, options, analytics)

  await flushFinalBuffer(analytics, preInitBuffer)

  return [analytics, ctx]
}

/**
 * The public browser interface for Segment Analytics
 *
 * @example
 * ```ts
 *  export const analytics = new AnalyticsBrowser()
 *  analytics.load({ writeKey: 'foo' })
 * ```
 * @link https://github.com/segmentio/analytics-next/#readme
 */
export class AnalyticsBrowser extends AnalyticsBuffered {
  private _resolveLoadStart: (
    settings: AnalyticsBrowserSettings,
    options: InitOptions
  ) => void

  constructor() {
    const { promise: loadStart, resolve: resolveLoadStart } =
      createDeferred<Parameters<AnalyticsBrowser['load']>>()

    super((buffer) =>
      loadStart.then(([settings, options]) =>
        loadAnalytics(settings, options, buffer)
      )
    )

    this._resolveLoadStart = (settings, options) =>
      resolveLoadStart([settings, options])
  }

  /**
   * Fully initialize an analytics instance, including:
   *
   * * Fetching settings from the segment CDN (by default).
   * * Fetching all remote destinations configured by the user (if applicable).
   * * Flushing buffered analytics events.
   * * Loading all middleware.
   *
   * Note:️  This method should only be called *once* in your application.
   *
   * @example
   * ```ts
   * export const analytics = new AnalyticsBrowser()
   * analytics.load({ writeKey: 'foo' })
   * ```
   */
  load(
    settings: AnalyticsBrowserSettings,
    options: InitOptions = {}
  ): AnalyticsBrowser {
    this._resolveLoadStart(settings, options)
    return this
  }

  /**
   * Instantiates an object exposing Analytics methods.
   *
   * @example
   * ```ts
   * const ajs = AnalyticsBrowser.load({ writeKey: '<YOUR_WRITE_KEY>' })
   *
   * ajs.track("foo")
   * ...
   * ```
   */
  static load(
    settings: AnalyticsBrowserSettings,
    options: InitOptions = {}
  ): AnalyticsBrowser {
    return new AnalyticsBrowser().load(settings, options)
  }

  static standalone(
    writeKey: string,
    options?: InitOptions
  ): Promise<Analytics> {
    return AnalyticsBrowser.load({ writeKey }, options).then((res) => res[0])
  }
}
