import fetch from 'unfetch'
import { Analytics, AnalyticsSettings, InitOptions } from './analytics'
import { Context } from './core/context'
import { MetricsOptions } from './core/stats/remote-metrics'
import { ajsDestinations } from './extensions/ajs-destination'
import { metadataEnrichment } from './extensions/metadata-enrichment'
import { pageEnrichment } from './extensions/page-enrichment'
import { remoteMiddlewares } from './extensions/remote-middleware'
import { RoutingRule } from './extensions/routing-middleware'
import { validation } from './extensions/validation'

export { LegacyDestination } from './extensions/ajs-destination'

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
}

const CDN_PATH = 'https://cdn-settings.segment.com'

export async function loadLegacySettings(
  writeKey: string
): Promise<LegacySettings> {
  const legacySettings: LegacySettings = {
    integrations: {},
  }

  try {
    return await fetch(
      `${CDN_PATH}/v1/projects/${writeKey}/settings`
    ).then((res) => res.json())
  } catch (err) {
    // proceed with default legacy settings
    console.warn('Failed to load legacy settings', err)
  }

  return Promise.resolve(legacySettings)
}

export class AnalyticsBrowser {
  static async load(
    settings: AnalyticsSettings,
    options: InitOptions = {}
  ): Promise<[Analytics, Context]> {
    const analytics = new Analytics(settings, options)

    const extensions = settings.extensions ?? []
    const legacySettings = await loadLegacySettings(settings.writeKey)
    Context.initMetrics(legacySettings.metrics)

    const remoteExtensions =
      process.env.NODE_ENV !== 'test'
        ? await ajsDestinations(legacySettings, analytics.integrations, options)
        : []

    const metadata = metadataEnrichment(
      legacySettings,
      analytics.queue.failedInitializations
    )
    const toRegister = [
      validation,
      pageEnrichment,
      metadata,
      ...extensions,
      ...remoteExtensions,
    ]
    const ctx = await analytics.register(...toRegister)

    const middleware = await remoteMiddlewares(ctx, legacySettings)
    middleware.forEach((mdw) => analytics.addSourceMiddleware(mdw))

    analytics.emit('initialize', settings, options)

    if (options.initialPageview) {
      await analytics.page()
    }

    return [analytics, ctx]
  }

  static async standalone(
    writeKey: string,
    options?: InitOptions
  ): Promise<Analytics> {
    const [analytics] = await AnalyticsBrowser.load({ writeKey }, options)
    return analytics
  }
}
