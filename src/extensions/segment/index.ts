/* eslint-disable @typescript-eslint/no-explicit-any */
import { Extension } from '../../core/extension'
import { loadScript } from '../../lib/load-script'
import facade from 'segmentio-facade'

declare global {
  interface Window {
    [integration: string]: unknown
  }
}

const path = 'https://ajs-next-integrations.s3-us-west-2.amazonaws.com'

export function segment(settings?: object): Extension {
  let integration: any

  const xt: Extension = {
    name: 'segmentio',
    type: 'destination',
    version: '0.1.0',

    isLoaded: () => {
      return integration.loaded()
    },

    load: async (_ctx, analyticsInstance) => {
      await loadScript(`${path}/segmentio/latest/bundle.js`)
      const constructor = window[`segmentioIntegration`] as any
      integration = new constructor(settings)
      integration.analytics = analyticsInstance
      integration.initialize()
    },

    async track(ctx) {
      const evt = new facade.Track(ctx.event)
      integration.ontrack(evt)
      integration.track(evt)
      return ctx
    },
  }

  return xt
}
