/* eslint-disable @typescript-eslint/no-explicit-any */
import { Extension } from '../../core/extension'
import { loadScript } from '../../lib/load-script'

import facade from 'segmentio-facade'
import { Analytics } from '@/core'

declare global {
  interface Window {
    [integration: string]: any
  }
}

export interface LegacyIntegration {
  analytics?: Analytics
  initialize: () => void
  loaded: () => boolean

  ontrack?: (event: Facade.Track) => void
  track?: (event: Facade.Track) => void

  onidentify?: (event: Facade.Identify) => void
  identify?: (event: Facade.Identify) => void
}

const path = 'https://ajs-next-integrations.s3-us-west-2.amazonaws.com'

export function ajsDestination(name: string, version: string, settings?: any): Extension {
  let integration: LegacyIntegration

  const xt: Extension = {
    name,
    type: 'destination',
    version,

    isLoaded: () => {
      return Boolean(integration?.loaded())
    },

    load: async (_ctx, analyticsInstance) => {
      await loadScript(`${path}/${name}/${version}/bundle.js`)

      const constructor = window[`${name}Integration`]
      integration = new constructor(settings)
      integration.analytics = analyticsInstance
      integration.initialize()
    },

    async track(ctx) {
      const trackEvent = new facade.Track(ctx.event)

      if (integration.ontrack) {
        integration.ontrack(trackEvent)
      }

      if (integration.track) {
        integration.track(trackEvent)
      }

      return ctx
    },

    async identify(ctx) {
      const trackEvent = new facade.Identify(ctx.event)

      if (integration.onidentify) {
        integration.onidentify(trackEvent)
      }

      if (integration.identify) {
        integration.identify(trackEvent)
      }

      return ctx
    },
  }

  return xt
}

export async function ajsDestinations(writeKey: string): Promise<Extension[]> {
  const settingsResponse = await fetch(`https://cdn-settings.segment.com/v1/projects/${writeKey}/settings`)
  const settings = await settingsResponse.json()

  return Object.entries(settings.integrations).map(([name, settings]) => {
    return ajsDestination(name.toLowerCase(), 'latest', settings)
  })
}
