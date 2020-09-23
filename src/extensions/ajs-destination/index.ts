/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Extension } from '../../core/extension'
import { loadScript } from '../../lib/load-script'

import { Track } from '@segment/facade/dist/track'
import { Identify } from '@segment/facade/dist/identify'
import { Analytics } from '@/index'

export interface LegacyIntegration {
  analytics?: Analytics
  initialize: () => void
  loaded: () => boolean

  track?: (event: typeof Track) => void
  identify?: (event: typeof Identify) => void
}

const path = 'https://ajs-next-integrations.s3-us-west-2.amazonaws.com'

export function ajsDestination(name: string, version: string, settings?: object): Extension {
  let integration: LegacyIntegration

  const xt: Extension = {
    name,
    type: 'destination',
    version,

    isLoaded: () => {
      return Boolean(integration?.loaded())
    },

    load: async (_ctx, analyticsInstance) => {
      await loadScript(`${path}/${name}/${version}/${name}.js`)

      // @ts-ignore
      const constructor = window[`${name}Integration`]
      integration = new constructor(settings)
      integration.analytics = analyticsInstance
      integration.initialize()
    },

    async track(ctx) {
      // @ts-ignore
      const trackEvent = new Track(ctx.event, {})

      if (integration.track) {
        integration.track(trackEvent)
      }

      return ctx
    },

    async identify(ctx) {
      // @ts-ignore
      const trackEvent = new Identify(ctx.event, {})

      if (integration.identify) {
        integration.identify(trackEvent)
      }

      return ctx
    },
  }

  return xt
}

export async function ajsDestinations(writeKey: string): Promise<Extension[]> {
  const [settingsResponse] = await Promise.all([
    fetch(`https://cdn-settings.segment.com/v1/projects/${writeKey}/settings`),
    loadScript(`${path}/commons/latest/commons.js`),
  ])

  const settings = await settingsResponse.json()

  return Object.entries(settings.integrations).map(([name, settings]) => {
    const integrationName = name.toLowerCase().replace('.', '')
    return ajsDestination(integrationName, 'latest', settings as object)
  })
}
