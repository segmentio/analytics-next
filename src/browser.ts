if (process.env.ASSET_PATH) {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/camelcase
  __webpack_public_path__ = process.env.ASSET_PATH
}

import fetch from 'unfetch'
import { Analytics, AnalyticsSettings, InitOptions } from './analytics'
import { Context } from './core/context'
import { Plan } from './core/events'
import { MetricsOptions } from './core/stats/remote-metrics'
import { pageEnrichment } from './plugins/page-enrichment'
import type { RoutingRule } from './plugins/routing-middleware'
import { segmentio, SegmentioSettings } from './plugins/segmentio'
import { validation } from './plugins/validation'

export interface LegacyIntegrationConfiguration {
  /* @deprecated - This does not indicate version types anymore */
  version?: string

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
}

function getCDN(): string | undefined {
  const regex = /(https:\/\/.*)\/analytics\.js\/v1\/(?:.*?)\/(?:platform|analytics.*)?/
  const scripts = Array.from(document.querySelectorAll('script'))
  let cdn: string | undefined = undefined

  scripts.forEach((s) => {
    const src = s.getAttribute('src') ?? ''
    const result = regex.exec(src)

    if (result && result[1]) {
      cdn = result[1]
    }
  })

  return cdn
}

export function loadLegacySettings(writeKey: string): Promise<LegacySettings> {
  const legacySettings: LegacySettings = {
    integrations: {},
  }
  const cdn = getCDN() ?? 'https://cdn-settings.segment.com'
  return fetch(`${cdn}/v1/projects/${writeKey}/settings`)
    .then((res) => res.json())
    .catch((err) => {
      console.warn('Failed to load legacy settings', err)
      return legacySettings
    })
}

function hasLegacyDestinations(settings: LegacySettings): boolean {
  return (
    process.env.NODE_ENV !== 'test' &&
    // just one integration means segmentio
    Object.keys(settings.integrations).length > 1
  )
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

    const remotePlugins = hasLegacyDestinations(legacySettings)
      ? await import(
          /* webpackChunkName: "ajs-destination" */ './plugins/ajs-destination'
        ).then((mod) => {
          return mod.ajsDestinations(
            legacySettings,
            analytics.integrations,
            opts
          )
        })
      : []

    if (legacySettings.legacyVideoPluginsEnabled) {
      await import(
        /* webpackChunkName: "legacyVideos" */ './plugins/legacy-video-plugins'
      ).then((mod) => {
        return mod.loadLegacyVideoPlugins(analytics)
      })
    }

    const toRegister = [
      validation,
      pageEnrichment,
      ...plugins,
      ...remotePlugins,
      segmentio(
        analytics,
        legacySettings.integrations['Segment.io'] as SegmentioSettings,
        legacySettings.integrations
      ),
    ]
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
    analytics.initialized = true
    analytics.emit('initialize', settings, options)

    if (options.initialPageview) {
      analytics.page().catch(console.error)
    }

    if (window.location.search) {
      Promise.all(analytics.queryString(window.location.search)).catch(
        console.error
      )
    }

    return [analytics, ctx]
  }

  static standalone(
    writeKey: string,
    options?: InitOptions
  ): Promise<Analytics> {
    return AnalyticsBrowser.load({ writeKey }, options).then((res) => res[0])
  }
}
