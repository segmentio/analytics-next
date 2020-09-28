/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Extension } from '../../core/extension'
import { loadScript } from '../../lib/load-script'
import fetch from 'unfetch'

import { Track } from '@segment/facade/dist/track'
import { Identify } from '@segment/facade/dist/identify'
import { Analytics } from '@/index'
import { Emmitter } from '@/core/emmitter'
import { User } from '@/core/user'

export interface LegacyIntegration extends Emmitter {
  analytics?: Analytics
  initialize: () => void
  loaded: () => boolean

  track?: (event: typeof Track) => void
  identify?: (event: typeof Identify) => void
}

const path = process.env.LEGACY_INTEGRATIONS_PATH ?? 'https://ajs-next-integrations.s3-us-west-2.amazonaws.com'

export function ajsDestination(name: string, version: string, settings?: object): Extension {
  let integration: LegacyIntegration
  let ready = false

  const xt: Extension = {
    name,
    type: 'destination',
    version,

    isLoaded: () => {
      return ready
    },

    load: async (_ctx, analyticsInstance) => {
      await loadScript(`${path}/${name}/${version}/${name}.js`)

      // @ts-ignore
      let integrationBuilder = window[`${name}Integration`]

      // GA and Appcues use a different interface to instantiating integrations
      if (integrationBuilder.Integration) {
        const analyticsStub = {
          user: (): User => analyticsInstance.user(),
          addIntegration: (): void => {},
        }

        integrationBuilder(analyticsStub)
        integrationBuilder = integrationBuilder.Integration
      }

      integration = new integrationBuilder(settings)
      integration.analytics = analyticsInstance
      integration.once('ready', () => {
        ready = true
      })

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
    // loadScript(`${path}/commons/latest/commons.js`),
  ])

  const settings = await settingsResponse.json()
  return Object.entries(settings.integrations).map(([name, settings]) => {
    const integrationName = name.toLowerCase().replace('.', '').replace(/\s+/g, '-')
    return ajsDestination(integrationName, 'latest', settings as object)
  })
}
