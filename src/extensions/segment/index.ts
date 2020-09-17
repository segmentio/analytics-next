import { Extension } from '@/core/extension'
import 'whatwg-fetch'

const path = 'https://api.segment.io/v1'

export function segment(writeKey: string): Extension {
  const xt: Extension = {
    name: 'Segment',
    type: 'destination',
    version: '1.0.0',

    isLoaded: () => {
      return writeKey !== ''
    },

    load: async () => {
      return Promise.resolve()
    },

    track: async (ctx) => {
      await fetch(`${path}/t`, {
        body: JSON.stringify({
          ...ctx.event,
          writeKey,
        }),
        method: 'POST',
        mode: 'cors',
      })

      return ctx
    },
  }

  return xt
}
