import { Extension } from '@/core/extension'
import { loadScript } from '@/lib/load-script'

export function ajsDestination(name: string, version: string): Extension {
  let loaded = false

  const xt: Extension = {
    name,
    type: 'destination',
    version,

    isLoaded: () => loaded,

    load: async () => {
      await loadScript(`https://ajs-next-integrations.s3-us-west-2.amazonaws.com/${name}/${version}/bundle.js`)
      loaded = true
    },

    async track(ctx) {
      return ctx
    },
  }

  return xt
}
