import { Extension } from '../../core/extension'
import { loadScript } from '../../lib/load-script'

declare global {
  interface Window {
    [integration: string]: any
  }
}

function ajsDestination(name: string, version: string, settings?: any): Extension {
  let integration: any

  const xt: Extension = {
    name,
    type: 'destination',
    version,

    isLoaded: () => {
      return integration.loaded()
    },

    load: async (_ctx) => {
      await loadScript(`https://ajs-next-integrations.s3-us-west-2.amazonaws.com/${name}/${version}/bundle.js`)

      const constructor = window[`${name}Integration`]
      integration = new constructor(settings)
      integration.initialize()
    },

    async track(ctx) {
      integration.track({
        event: () => ctx.event.event,
        properties: () => ctx.event.properties,
        options: () => ctx.event.options,
        proxy: () => undefined,
        revenue: () => undefined,
      })

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
