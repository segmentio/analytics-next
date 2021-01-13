import { Plugin } from '../../core/plugin'
import { LegacySettings } from '../../browser'
import { Context } from '../../core/context'

function enrich(
  ctx: Context,
  settings: LegacySettings,
  failed: string[]
): Context {
  const bundled: string[] = []
  const unbundled: string[] = []

  Object.entries(settings.integrations).forEach(([key, integration]) => {
    if (key === 'Segment.io') {
      bundled.push(key)
    }
    if (integration.bundlingStatus === 'bundled') {
      bundled.push(key)
    }
    if (integration.bundlingStatus === 'unbundled') {
      unbundled.push(key)
    }
  })

  ctx.event._metadata = {
    bundled: bundled.sort(),
    unbundled: unbundled.sort(),
    failedInitializations: failed.sort(),
  }
  return ctx
}

export function metadataEnrichment(
  settings: LegacySettings,
  failedInitializations: string[]
): Plugin {
  return {
    name: 'Metadata Enrichment',
    version: '0.1.0',
    isLoaded: (): boolean => true,
    load: (): Promise<void> => Promise.resolve(),
    type: 'enrichment',

    page: async (ctx): Promise<Context> =>
      enrich(ctx, settings, failedInitializations),
    alias: async (ctx): Promise<Context> =>
      enrich(ctx, settings, failedInitializations),
    track: async (ctx): Promise<Context> =>
      enrich(ctx, settings, failedInitializations),
    identify: async (ctx): Promise<Context> =>
      enrich(ctx, settings, failedInitializations),
    group: async (ctx): Promise<Context> =>
      enrich(ctx, settings, failedInitializations),
  }
}
