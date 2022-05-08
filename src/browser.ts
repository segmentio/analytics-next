import { getProcessEnv } from './lib/get-process-env'
import { getCDN, setGlobalCDNUrl } from './lib/parse-cdn'

import fetch from 'unfetch'
import { Analytics, AnalyticsSettings, InitOptions } from './analytics'
import { Context } from './core/context'
import { Plan } from './core/events'
import { Plugin } from './core/plugin'
import { MetricsOptions } from './core/stats/remote-metrics'
import { mergedOptions } from './lib/merged-options'
import { pageEnrichment } from './plugins/page-enrichment'
import { remoteLoader, RemotePlugin } from './plugins/remote-loader'
import type { RoutingRule } from './plugins/routing-middleware'
import { segmentio, SegmentioSettings } from './plugins/segmentio'
import { validation } from './plugins/validation'
import {
  AnalyticsBuffered,
  PreInitMethodCallBuffer,
  PreInitMethodCall,
} from './analytics-preload'

export interface LegacyIntegrationConfiguration {
  /* @deprecated - This does not indicate browser types anymore */
  type?: string

  versionSettings?: {
    version?: string
    override?: string
    componentTypes?: Array<'browser' | 'android' | 'ios' | 'server'>
  }

  bundlingStatus?: string

  // Segment.io specific
  retryQueue?: boolean

  // any extra unknown settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface LegacySettings {
  integrations: {
    [name: string]: LegacyIntegrationConfiguration
  }

  middlewareSettings?: {
    routingRules: RoutingRule[]
  }

  enabledMiddleware?: Record<string, boolean>
  metrics?: MetricsOptions

  plan?: Plan

  legacyVideoPluginsEnabled?: boolean

  remotePlugins?: RemotePlugin[]
}

export interface AnalyticsBrowserSettings extends AnalyticsSettings {
  /**
   * The settings for the Segment Source.
   * If provided, `AnalyticsBrowser` will not fetch remote settings
   * for the source.
   */
  cdnSettings?: LegacySettings & Record<string, unknown>
  /**
   * If provided, will override the default Segment CDN (https://cdn.segment.com) for this application.
   */
  cdnURL?: string
}

export function loadLegacySettings(
  writeKey: string,
  cdnURL?: string
): Promise<LegacySettings> {
  const baseUrl = cdnURL ?? getCDN()

  return fetch(`${baseUrl}/v1/projects/${writeKey}/settings`)
    .then((res) => res.json())
    .catch((err) => {
      console.warn('Failed to load settings', err)
      throw err
    })
}

function hasLegacyDestinations(settings: LegacySettings): boolean {
  return (
    getProcessEnv().NODE_ENV !== 'test' &&
    // just one integration means segmentio
    Object.keys(settings.integrations).length > 1
  )
}

function flushBuffered(analytics: Analytics, buffer: PreInitMethodCallBuffer) {
  const callBufferedAnalyticsMethod = async (methodCall: PreInitMethodCall) => {
    const { method } = methodCall
    // this guard is probably not needed.
    if (typeof analytics[method] !== 'function') {
      return console.warn(
        `invariant error: method call "${method}" does not exist on analytics instance: ${analytics}`
      )
    }
    if (method === 'addSourceMiddleware') {
      await buffer.callMethod(analytics, methodCall)
    } else {
      // flush each individual event as its own task, so not to block initial page loads
      setTimeout(() => {
        // should never throw an error
        void buffer.callMethod(analytics, methodCall).catch(console.error)
      }, 0)
    }
  }

  buffer.list.forEach((m) => {
    callBufferedAnalyticsMethod(m).catch(console.error)
  })
}

/**
 * With AJS classic, we allow users to call setAnonymousId before the library initialization.
 * This is important because some of the destinations will use the anonymousId during the initialization,
 * and if we set anonId afterwards, that wouldn’t impact the destination.
 *
 * Also Ensures events can be registered before library initialization.
 * This is important so users can register to 'initialize' and any events that may fire early during setup.
 */
async function flushPreBuffer(
  analytics: Analytics,
  buffer: PreInitMethodCallBuffer
): Promise<void> {
  const setAnonymousId = buffer.list.find(
    (el) => el.method === 'setAnonymousId'
  )
  if (setAnonymousId) {
    // callMethod treats every method as async to be  runtime / typesafe, since await works on promise values and non-promise values.
    // in my testing on chrome, the performance burden of this added await (awaiting two promise wrapped values with Promise.all) is less than a half a millisecond.
    await buffer.callMethod(analytics, setAnonymousId)
  }

  // promise.all will not work, since we don't want terminate if there's an error.
  // promise.allSettled would be an option here (if browser compat was less of an issue)

  // Return immediately without waiting for promises to resolve
  const onMethods = buffer.list.filter((el) => el.method === 'on')
  onMethods.forEach((m) => {
    // call method will never reject
    void buffer.callMethod(analytics, m)
  })
}

async function registerPlugins(
  legacySettings: LegacySettings,
  analytics: Analytics,
  opts: InitOptions,
  options: InitOptions,
  plugins: Plugin[]
): Promise<Context> {
  const legacyDestinations = hasLegacyDestinations(legacySettings)
    ? await import(
        /* webpackChunkName: "ajs-destination" */ './plugins/ajs-destination'
      ).then((mod) => {
        return mod.ajsDestinations(legacySettings, analytics.integrations, opts)
      })
    : []

  if (legacySettings.legacyVideoPluginsEnabled) {
    await import(
      /* webpackChunkName: "legacyVideos" */ './plugins/legacy-video-plugins'
    ).then((mod) => {
      return mod.loadLegacyVideoPlugins(analytics)
    })
  }

  const schemaFilter = opts.plan?.track
    ? await import(
        /* webpackChunkName: "schemaFilter" */ './plugins/schema-filter'
      ).then((mod) => {
        return mod.schemaFilter(opts.plan?.track, legacySettings)
      })
    : undefined

  const mergedSettings = mergedOptions(legacySettings, options)
  const remotePlugins = await remoteLoader(
    legacySettings,
    analytics.integrations,
    options.obfuscate
  ).catch(() => [])

  const toRegister = [
    validation,
    pageEnrichment,
    ...plugins,
    ...legacyDestinations,
    ...remotePlugins,
  ]

  if (schemaFilter) {
    toRegister.push(schemaFilter)
  }

  const shouldIgnoreSegmentio =
    (opts.integrations?.All === false && !opts.integrations['Segment.io']) ||
    (opts.integrations && opts.integrations['Segment.io'] === false)

  if (!shouldIgnoreSegmentio) {
    toRegister.push(
      segmentio(
        analytics,
        mergedSettings['Segment.io'] as SegmentioSettings,
        legacySettings.integrations
      )
    )
  }

  const ctx = await analytics.register(...toRegister)

  if (
    Object.entries(legacySettings.enabledMiddleware ?? {}).some(
      ([, enabled]) => enabled
    )
  ) {
    await import(
      /* webpackChunkName: "remoteMiddleware" */ './plugins/remote-middleware'
    ).then(async ({ remoteMiddlewares }) => {
      const middleware = await remoteMiddlewares(
        ctx,
        legacySettings,
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

export class AnalyticsBrowser {
  /**
   * Clear the global state. Useful mainly for testing.
   */
  static _resetGlobalState() {
    setGlobalCDNUrl(undefined as any)
  }

  static load(
    settings: AnalyticsBrowserSettings,
    options: InitOptions = {}
  ): AnalyticsBuffered {
    return new AnalyticsBuffered((preInitBuffer) =>
      this._load(settings, options, preInitBuffer)
    )
  }

  private static async _load(
    settings: AnalyticsBrowserSettings,
    options: InitOptions = {},
    preInitBuffer: PreInitMethodCallBuffer
  ): Promise<[Analytics, Context]> {
    // this is an ugly side-effect, but it's for the benefits of the plugins that get their cdn via getCDN()
    if (settings.cdnURL) setGlobalCDNUrl(settings.cdnURL)

    const legacySettings =
      settings.cdnSettings ??
      (await loadLegacySettings(settings.writeKey, settings.cdnURL))

    const retryQueue: boolean =
      legacySettings.integrations['Segment.io']?.retryQueue ?? true

    const opts: InitOptions = { retryQueue, ...options }
    const analytics = new Analytics(settings, opts)

    const plugins = settings.plugins ?? []
    Context.initMetrics(legacySettings.metrics)

    // for snippet users, store all the cached window.analytics calls on the instance
    preInitBuffer.saveSnippetWindowBuffer()

    // needs to be flushed before plugins are registered
    await flushPreBuffer(analytics, preInitBuffer)

    const ctx = await registerPlugins(
      legacySettings,
      analytics,
      opts,
      options,
      plugins
    )

    const search = window.location.search ?? ''
    const hash = window.location.hash ?? ''

    const term = search.length ? search : hash.replace(/(?=#).*(?=\?)/, '')

    if (term.includes('ajs_')) {
      await analytics.queryString(term).catch(console.error)
    }

    analytics.initialized = true
    analytics.emit('initialize', settings, options)

    if (options.initialPageview) {
      analytics.page().catch(console.error)
    }

    flushBuffered(analytics, preInitBuffer)

    // Clear preInitQueue, just in case analytics is loaded twice; we don't want to fire events off again.
    // The snippet buffer automatically gets cleared (since window.analytics gets completely overwritten)
    preInitBuffer.clear()

    return [analytics, ctx]
  }

  static standalone(
    writeKey: string,
    options?: InitOptions
  ): Promise<Analytics> {
    return AnalyticsBrowser.load({ writeKey }, options).then((res) => res[0])
  }
}
