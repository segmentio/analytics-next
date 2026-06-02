import { PluginType } from '@segment/analytics-core'
import { Analytics } from '../../../core/analytics'
import { Plugin } from '../../../core/plugin'
import { normalizeIdentifyTraits } from '../identify/normalizeIdentifyTraits'
import type { ConversionCollectorSettings } from '../types'

export function conversionIdentifyEnrichment(
  settings: ConversionCollectorSettings
): Plugin {
  let analytics: Analytics | undefined

  return {
    name: 'Conversion Identify PII',
    type: 'before' as PluginType,
    version: '0.1.0',
    isLoaded: () => true,
    load: (_ctx, instance) => {
      analytics = instance as Analytics
      return Promise.resolve()
    },
    identify: async (ctx) => {
      const rawTraits = (ctx.event.traits ?? {}) as Record<string, unknown>
      const normalized = await normalizeIdentifyTraits(rawTraits, {
        defaultPhoneCountryCode: settings.defaultPhoneCountryCode,
      })
      ctx.updateEvent('traits', normalized)

      const userId = ctx.event.userId ?? analytics?.user().id()
      if (userId) {
        analytics?.user().identify(userId, normalized)
      }

      return ctx
    },
  }
}
