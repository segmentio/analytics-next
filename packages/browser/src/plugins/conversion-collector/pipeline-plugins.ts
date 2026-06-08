import { Plugin } from '../../core/plugin'
import { clickIdEnrichment } from './enrichment/click-id-enrichment'
import { conversionConsentEnrichment } from './enrichment/consent-enrichment'
import { conversionContextEnrichment } from './enrichment/context-enrichment'
import { conversionIdentifyEnrichment } from './enrichment/identify-enrichment'
import { conversionPageEnrichment } from './enrichment/page-enrichment'
import { conversionGptSlotEventsPlugin } from './gpt-slot-events'
import { conversionCollectorPlugin } from './destination-plugin'
import { sessionEnrichment } from './session-enrichment'
import type { ConversionCollectorSettings } from './types'

/**
 * MVP UTUA pipeline: click-ids (before) → session (enrichment) → collector.
 * Register together with `envEnrichment` in lean bootstrap.
 * Optional legacy enrichments are off unless explicitly enabled.
 */
export function conversionPipelinePlugins(
  settings: ConversionCollectorSettings
): Plugin[] {
  const plugins: Plugin[] = [
    clickIdEnrichment(),
    sessionEnrichment(settings),
    conversionCollectorPlugin(settings),
  ]

  if (
    settings.enableConsentEnrichment === true ||
    typeof settings.isTrackingAllowed === 'function'
  ) {
    plugins.unshift(conversionConsentEnrichment(settings))
  }

  if (settings.enableContextEnrichment === true) {
    plugins.unshift(conversionContextEnrichment(settings))
  }

  if (settings.enableIdentifyHashing === true) {
    const collectorIndex = plugins.findIndex(
      (p) => p.name === 'Conversion Collector'
    )
    plugins.splice(
      collectorIndex >= 0 ? collectorIndex : plugins.length,
      0,
      conversionIdentifyEnrichment(settings)
    )
  }

  if (settings.enablePageTaxonomy === true) {
    const collectorIndex = plugins.findIndex(
      (p) => p.name === 'Conversion Collector'
    )
    plugins.splice(
      collectorIndex >= 0 ? collectorIndex : plugins.length,
      0,
      conversionPageEnrichment(settings)
    )
  }

  if (settings.enableGptSlotEvents === true) {
    plugins.push(conversionGptSlotEventsPlugin())
  }

  return plugins
}
