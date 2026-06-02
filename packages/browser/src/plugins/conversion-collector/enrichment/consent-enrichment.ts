import { PluginType } from '@segment/analytics-core'
import { Context, ContextCancelation } from '../../../core/context'
import { Plugin } from '../../../core/plugin'
import type { ConversionCollectorSettings } from '../types'

function isTrackingAllowed(settings: ConversionCollectorSettings): boolean {
  if (settings.isTrackingAllowed?.() === false) {
    return false
  }

  if (settings.respectDoNotTrack === false) {
    return true
  }

  const dnt =
    typeof navigator !== 'undefined'
      ? (navigator as Navigator).doNotTrack
      : undefined
  return dnt !== '1' && dnt !== 'yes'
}

export function conversionConsentEnrichment(
  settings: ConversionCollectorSettings
): Plugin {
  const drop = (ctx: Context): Context => {
    if (!isTrackingAllowed(settings)) {
      ctx.cancel(
        new ContextCancelation({
          retry: false,
          type: 'Conversion Consent',
          reason: 'Tracking not allowed',
        })
      )
    }
    return ctx
  }

  return {
    name: 'Conversion Consent',
    type: 'before' as PluginType,
    version: '0.1.0',
    isLoaded: () => true,
    load: () => Promise.resolve(),
    track: drop,
    identify: drop,
    page: drop,
    screen: drop,
    alias: drop,
    group: drop,
  }
}
