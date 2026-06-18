import { PluginType } from '@segment/analytics-core'
import { Context } from '../../../core/context'
import { Plugin } from '../../../core/plugin'
import type { ConversionCollectorSettings } from '../types'
import { getOrCreateSessionId } from './session-manager'

export function sessionEnrichment(
  settings: ConversionCollectorSettings
): Plugin {
  let currentSessionId = ''

  const enrich = (ctx: Context): Context => {
    currentSessionId = settings.getSessionId?.() ?? getOrCreateSessionId()

    const evtCtx = ctx.event.context ?? {}
    ctx.updateEvent('context', {
      ...evtCtx,
      sessionId: currentSessionId,
    })

    return ctx
  }

  return {
    name: 'session-enrichment',
    type: 'enrichment' as PluginType,
    version: '0.1.0',
    isLoaded: () => true,
    load: () => Promise.resolve(),
    track: enrich,
    identify: enrich,
    page: enrich,
    screen: enrich,
    alias: enrich,
    group: enrich,
  }
}

export { getOrCreateSessionId } from './session-manager'
export {
  SESSION_COOKIE,
  ACTIVITY_COOKIE,
  SESSION_INACTIVITY_MS,
} from './session-manager'
