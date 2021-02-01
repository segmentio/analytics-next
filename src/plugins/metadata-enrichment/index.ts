import type { Plugin } from '../../core/plugin'
import type { LegacySettings } from '../../browser'
import type { Context } from '../../core/context'

const version = process.env.VERSION ?? 'undefined'

export function metadataEnrichment(
  settings: LegacySettings,
  failedInitializations: string[]
): Plugin {
  function enrich(ctx: Context): Context {
    const bundled: string[] = []
    const unbundled: string[] = []

    for (const key in settings.integrations) {
      const integration = settings.integrations[key]
      if (key === 'Segment.io') {
        bundled.push(key)
      }
      if (integration.bundlingStatus === 'bundled') {
        bundled.push(key)
      }
      if (integration.bundlingStatus === 'unbundled') {
        unbundled.push(key)
      }
    }

    ctx.updateEvent('context.library.name', 'analytics-next')
    ctx.updateEvent('context.library.version', version)

    ctx.event._metadata = {
      bundled: bundled.sort(),
      unbundled: unbundled.sort(),
      failedInitializations: failedInitializations.sort(),
    }

    return ctx
  }

  return {
    name: 'Metadata Enrichment',
    version: '0.1.0',
    isLoaded: (): boolean => true,
    load: (): Promise<void> => Promise.resolve(),
    type: 'enrichment',

    page: enrich,
    alias: enrich,
    track: enrich,
    identify: enrich,
    group: enrich,
  }
}
