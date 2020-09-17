import { Extension } from '@/core/extension'

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
      const body = JSON.stringify({
        ...ctx.event,
        writeKey,
      })

      await fetch(`${path}/t`, {
        body,
        method: 'POST',
        mode: 'cors',
      })

      return ctx
    },
  }

  return xt
}
