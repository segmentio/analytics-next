/* eslint-disable @typescript-eslint/no-explicit-any */
import { Extension } from '../../core/extension'
import { loadScript } from '../../lib/load-script'
import facade from 'segmentio-facade'
import { LegacyIntegration } from '../ajs-destination'

declare global {
  interface Window {
    [integration: string]: unknown
  }
}

const path = 'https://ajs-next-integrations.s3-us-west-2.amazonaws.com'

export function segment(settings?: object): Extension {
  let integration: LegacyIntegration

  const xt: Extension = {
    name: 'segmentio',
    type: 'destination',
    version: '0.1.0',

    isLoaded: () => {
      return Boolean(integration?.loaded())
    },

    load: async (_ctx, analyticsInstance) => {
      await loadScript(`${path}/segmentio/latest/bundle.js`)
      const constructor = window[`segmentioIntegration`]
      integration = new constructor(settings)
      integration.analytics = analyticsInstance
      integration.initialize()
    },

    async track(ctx) {
      const evt = new facade.Track(ctx.event)
      if (integration.ontrack) {
        integration.ontrack(evt)
      }

      if (integration.track) {
        integration.track(evt)
      }

      return ctx
    },
  }

  return xt
}
