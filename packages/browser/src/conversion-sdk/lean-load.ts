import { Analytics } from '../core/analytics'
import { Plugin } from '../core/plugin'
import { envEnrichment } from '../plugins/env-enrichment'
import { conversionPipelinePlugins } from '../plugins/conversion-collector'
import { toCollectorSettings } from './config'
import type { AnalyticsInitConfig } from './types'

/**
 * Minimal Analytics bootstrap — skips AnalyticsBrowser.load (remote-loader, CDN, segmentio).
 */
export async function loadLeanConversionAnalytics(
  config: AnalyticsInitConfig,
  extraPlugins: Plugin[] = []
): Promise<Analytics> {
  const writeKey = config.writeKey ?? 'conversion-pipeline'
  const collectorSettings = toCollectorSettings(config)

  const analytics = new Analytics({
    writeKey,
    cdnURL: 'https://cdn.conversion-pipeline.local',
  })

  const pipeline = conversionPipelinePlugins({
    ...collectorSettings,
    enableGptSlotEvents: false,
  })

  await analytics.register(envEnrichment, ...pipeline, ...extraPlugins)
  return analytics
}
