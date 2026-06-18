import { PluginType } from '@segment/analytics-core'
import { Plugin } from '../../core/plugin'

/** No-op GPT plugin — replaced at build time when CONVERSION_INCLUDE_GPT=1. */
export function conversionGptSlotEventsPlugin(): Plugin {
  return {
    name: 'Conversion GPT Slot Events (disabled)',
    type: 'utility' as PluginType,
    version: '0.0.0',
    isLoaded: () => true,
    load: () => Promise.resolve(),
  }
}
