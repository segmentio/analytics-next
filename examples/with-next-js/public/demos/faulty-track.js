const faultyTrack = {
  name: 'Fails to send',
  type: 'destination',
  version: '1.0',

  load: async () => {},
  isLoaded: () => true,

  track(ctx) {
    if (ctx.event.context?.attempts < 2) {
      throw new Error('aaay')
    }

    return ctx
  },
}

window.analytics.register(faultyTrack)
