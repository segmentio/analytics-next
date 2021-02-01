// @ts-ignore
// eslint-disable-next-line @typescript-eslint/camelcase
__webpack_public_path__ = process.env.ASSET_PATH

import fetch from 'unfetch'
import { Analytics, AnalyticsSettings, InitOptions } from './analytics'
import { Context } from './core/context'
import { Plan } from './core/events'
import { MetricsOptions } from './core/stats/remote-metrics'
import { metadataEnrichment } from './plugins/metadata-enrichment'
import { pageEnrichment } from './plugins/page-enrichment'
import type { RoutingRule } from './plugins/routing-middleware'
import { validation } from './plugins/validation'

export interface LegacyIntegrationConfiguration {
  type?: string
  // The version field is temporary as some sources were not rebuilt yet.
  version?: string
  versionSettings?: {
    version?: string
    override?: string
  }
  bundlingStatus?: string
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

const CDN_PATH = 'https://cdn-settings.segment.com'

export function loadLegacySettings(writeKey: string): Promise<LegacySettings> {
  const legacySettings: LegacySettings = {
    integrations: {},
  }

  return fetch(`${CDN_PATH}/v1/projects/${writeKey}/settings`)
    .then((res) => res.json())
    .catch((err) => {
      console.warn('Failed to load legacy settings', err)
      return legacySettings
    })
}

export class AnalyticsBrowser {
  static async load(
    settings: AnalyticsSettings,
    options: InitOptions = {}
  ): Promise<[Analytics, Context]> {
    const analytics = new Analytics(settings, options)

    const plugins = settings.plugins ?? []
    const legacySettings = await loadLegacySettings(settings.writeKey)
    Context.initMetrics(legacySettings.metrics)

    const remotePlugins =
      process.env.NODE_ENV !== 'test'
        ? await import(
            /* webpackChunkName: "ajs-destination" */ './plugins/ajs-destination'
          ).then((mod) => {
            return mod.ajsDestinations(
              legacySettings,
              analytics.integrations,
              options
            )
          })
        : []

    const metadata = metadataEnrichment(
      legacySettings,
      analytics.queue.failedInitializations
    )

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
      metadata,
      ...plugins,
      ...remotePlugins,
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

    analytics.emit('initialize', settings, options)

    if (options.initialPageview) {
      await analytics.page()
    }

    if (window.location.search) {
      await Promise.all(analytics.queryString(window.location.search))
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
