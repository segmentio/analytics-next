import { PluginType } from '@segment/analytics-core'
import { Context } from '../../../core/context'
import { Plugin } from '../../../core/plugin'

const CLICK_KEYS = [
  'gclid',
  'fbclid',
  'ttclid',
  'tt_clid',
  'msclkid',
  'twclid',
] as const

export function clickIdEnrichment(): Plugin {
  const enrich = (ctx: Context): Context => {
    const evtCtx = ctx.event.context ?? {}
    const search =
      typeof evtCtx.page?.search === 'string' ? evtCtx.page.search : ''
    if (!search) {
      return ctx
    }
    const usp = new URLSearchParams(
      search.startsWith('?') ? search.slice(1) : search
    )
    const clickIds: Record<string, string> = {}
    for (const key of CLICK_KEYS) {
      const v = usp.get(key)
      if (v) {
        clickIds[key === 'tt_clid' ? 'ttclid' : key] = v
      }
    }
    if (Object.keys(clickIds).length === 0) {
      return ctx
    }
    ctx.updateEvent('context', {
      ...evtCtx,
      campaign: { ...(evtCtx.campaign as object), ...clickIds },
    })
    return ctx
  }

  return {
    name: 'click-id-enrichment',
    type: 'before' as PluginType,
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
