import { Plugin } from '../../core/plugin'
import { conversionConsentEnrichment } from './enrichment/consent-enrichment'
import { conversionContextEnrichment } from './enrichment/context-enrichment'
import { conversionIdentifyEnrichment } from './enrichment/identify-enrichment'
import { conversionPageEnrichment } from './enrichment/page-enrichment'
import { conversionGptSlotEventsPlugin } from './gpt-slot-events'
import { conversionCollectorPlugin } from './destination-plugin'
import type { ConversionCollectorSettings } from './types'

/**
 * Registers the full UTUA conversion pipeline: consent → context → PII → page → collector (+ optional GPT).
 * Pass the returned array as `plugins` in `AnalyticsBrowser.load`.
 */
export function conversionPipelinePlugins(
  settings: ConversionCollectorSettings
): Plugin[] {
  const plugins: Plugin[] = [
    conversionConsentEnrichment(settings),
    conversionContextEnrichment(settings),
    conversionIdentifyEnrichment(settings),
    conversionPageEnrichment(settings),
    conversionCollectorPlugin(settings),
  ]

  if (settings.enableGptSlotEvents === true) {
    plugins.push(conversionGptSlotEventsPlugin())
  }

  return plugins
}
