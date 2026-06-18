import { PluginType } from '@segment/analytics-core'
import { Analytics } from '../../../core/analytics'
import { Context } from '../../../core/context'
import { Plugin } from '../../../core/plugin'
import { resolveContext } from '../lib/resolve-context'
import { getOrCreateAnonymousId, getOrCreateSessionId } from '../lib/session'
import type { ConversionCollectorSettings } from '../types'

export function conversionContextEnrichment(
  settings: ConversionCollectorSettings
): Plugin {
  let analytics: Analytics | undefined

  const enrich = (ctx: Context): Context => {
    if (!analytics) {
      return ctx
    }

    const bgAnonymousId = getOrCreateAnonymousId()
    if (analytics.user().anonymousId() !== bgAnonymousId) {
      analytics.user().anonymousId(bgAnonymousId)
    }
    ctx.updateEvent('anonymousId', bgAnonymousId)

    const sessionId = settings.getSessionId?.() ?? getOrCreateSessionId()
    const resolved = resolveContext(settings)

    const evtCtx = ctx.event.context ?? {}
    ctx.updateEvent('context', {
      ...evtCtx,
      ...resolved,
      sessionId,
    })

    const traits = analytics.user().traits()
    if (traits && Object.keys(traits).length > 0) {
      ctx.updateEvent('context.traits', traits)
    }

    return ctx
  }

  return {
    name: 'Conversion Context',
    type: 'before' as PluginType,
    version: '0.1.0',
    isLoaded: () => true,
    load: (_ctx, instance) => {
      analytics = instance as Analytics
      return Promise.resolve()
    },
    track: enrich,
    identify: enrich,
    page: enrich,
    screen: enrich,
    alias: enrich,
    group: enrich,
  }
}
