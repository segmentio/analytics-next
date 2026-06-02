import { PluginType } from '@segment/analytics-core'
import { Plugin } from '../../../core/plugin'
import {
  buildPageEventProperties,
  enrichWithSessionQueryParams,
} from '../lib/page-properties'
import type { ConversionCollectorSettings } from '../types'

export function conversionPageEnrichment(
  settings: ConversionCollectorSettings
): Plugin {
  return {
    name: 'Conversion Page Properties',
    type: 'before' as PluginType,
    version: '0.1.0',
    isLoaded: () => true,
    load: () => Promise.resolve(),
    page: async (ctx) => {
      const properties = await buildPageEventProperties(
        settings,
        (ctx.event.properties ?? {}) as Record<string, unknown>
      )
      ctx.updateEvent('properties', properties)
      return ctx
    },
    track: async (ctx) => {
      const eventName = ctx.event.type === 'track' ? ctx.event.event : undefined
      if (eventName === 'page') {
        const properties = await buildPageEventProperties(
          settings,
          (ctx.event.properties ?? {}) as Record<string, unknown>
        )
        ctx.updateEvent('properties', properties)
        return ctx
      }

      const properties = enrichWithSessionQueryParams(
        (ctx.event.properties ?? {}) as Record<string, unknown>
      )
      ctx.updateEvent('properties', properties)
      return ctx
    },
    screen: (ctx) => {
      const properties = enrichWithSessionQueryParams(
        (ctx.event.properties ?? {}) as Record<string, unknown>
      )
      ctx.updateEvent('properties', properties)
      return ctx
    },
  }
}
