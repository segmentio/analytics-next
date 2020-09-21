/* eslint-disable @typescript-eslint/no-explicit-any */
import { Extension } from '../../core/extension'
import { loadScript } from '../../lib/load-script'

import facade from 'segmentio-facade'

declare global {
  interface Window {
    [integration: string]: any
  }
}

const path = 'https://ajs-next-integrations.s3-us-west-2.amazonaws.com'

function ajsDestination(name: string, version: string, settings?: any): Extension {
  let integration: any

  const xt: Extension = {
    name,
    type: 'destination',
    version,

    isLoaded: () => {
      return integration.loaded()
    },

    load: async (_ctx, analyticsInstance) => {
      await loadScript(`${path}/${name}/${version}/bundle.js`)

      const constructor = window[`${name}Integration`] as any
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
  }

  return xt
}

export async function ajsDestinations(writeKey: string): Promise<Extension[]> {
  const settingsResponse = await fetch(`https://cdn-settings.segment.com/v1/projects/${writeKey}/settings`)
  const settings = await settingsResponse.json()

  const integrationSettings = settings.integrations['Amplitude']
  const version = '9d8f8fd72beb6fb21580'
  return [ajsDestination('amplitude', version, integrationSettings)]
}
