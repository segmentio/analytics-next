import { getProcessEnv } from './lib/get-process-env'
import { getCDN } from './lib/parse-cdn'

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

export function loadLegacySettings(writeKey: string): Promise<LegacySettings> {
  const cdn = window.analytics?._cdn ?? getCDN()
  return fetch(`${cdn}/v1/projects/${writeKey}/settings`)
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

async function flushBuffered(analytics: Analytics): Promise<void> {
  const wa = window.analytics
  const buffered =
    // @ts-expect-error
    wa && wa[0] ? [...wa] : []

  for (const [operation, ...args] of buffered) {
    if (
      // @ts-expect-error
      analytics[operation] &&
      // @ts-expect-error
      typeof analytics[operation] === 'function'
    ) {
      if (operation === 'addSourceMiddleware') {
        // @ts-expect-error
        await analytics[operation].call(analytics, ...args)
      } else {
        // flush each individual event as its own task, so not to block initial page loads
        setTimeout(() => {
          // @ts-expect-error
          analytics[operation].call(analytics, ...args)
        }, 0)
      }
    }
  }
}

/**
 * With AJS classic, we allow users to call setAnonymousId before the library initialization.
 * This is important because some of the destinations will use the anonymousId during the initialization,
 * and if we set anonId afterwards, that wouldn’t impact the destination.
 */
function flushAnonymousUser(analytics: Analytics): void {
  const wa = window.analytics
  const buffered =
    // @ts-expect-error
    wa && wa[0] ? [...wa] : []

  const anon = buffered.find(([op]) => op === 'setAnonymousId')
  if (anon) {
    const [, id] = anon
    analytics.setAnonymousId(id)
  }
}

/**
 * Ensures events can be registered before library initialization.
 * This is important so users can register to 'initialize' and any events that may fire early during setup.
 */

function flushEventEmitters(analytics: Analytics): void {
  const wa = window.analytics
  const buffered =
    //@ts-expect-error
    wa && wa[0] ? [...wa] : []
  const onHandlers = buffered.filter(
    ([operation]: [string]) => operation === 'on'
  )
  if (onHandlers.length) {
    onHandlers.forEach(([operation, ...args]) => {
      // @ts-expect-error
      analytics[operation].call(analytics, ...args)
    })
  }
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
  const remotePlugins = await remoteLoader(legacySettings).catch(() => [])

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

  if (Object.keys(legacySettings.enabledMiddleware ?? {}).length > 0) {
    await import(
      /* webpackChunkName: "remoteMiddleware" */ './plugins/remote-middleware'
    ).then(async ({ remoteMiddlewares }) => {
      const middleware = await remoteMiddlewares(ctx, legacySettings)
      const promises = middleware.map((mdw) =>
        analytics.addSourceMiddleware(mdw)
      )
      return Promise.all(promises)
    })
  }

  return ctx
}

export class AnalyticsBrowser {
  static async load(
    settings: AnalyticsSettings,
    options: InitOptions = {}
  ): Promise<[Analytics, Context]> {
    const legacySettings = await loadLegacySettings(settings.writeKey)

    const retryQueue: boolean =
      legacySettings.integrations['Segment.io']?.retryQueue ?? true

    const opts: InitOptions = { retryQueue, ...options }
    const analytics = new Analytics(settings, opts)

    const plugins = settings.plugins ?? []
    Context.initMetrics(legacySettings.metrics)

    // needs to be flushed before plugins are registered
    flushAnonymousUser(analytics)
    flushEventEmitters(analytics)

    const ctx = await registerPlugins(
      legacySettings,
      analytics,
      opts,
      options,
      plugins
    )

    analytics.initialized = true
    analytics.emit('initialize', settings, options)

    if (options.initialPageview) {
      analytics.page().catch(console.error)
    }

    const search = window.location.search ?? ''
    const hash = window.location.hash ?? ''

    const term = search.length ? search : hash.replace(/(?=#).*(?=\?)/, '')

    if (term.includes('ajs_')) {
      analytics.queryString(term).catch(console.error)
    }

    await flushBuffered(analytics)

    return [analytics, ctx]
  }

  static standalone(
    writeKey: string,
    options?: InitOptions
  ): Promise<Analytics> {
    return AnalyticsBrowser.load({ writeKey }, options).then((res) => res[0])
  }
}
