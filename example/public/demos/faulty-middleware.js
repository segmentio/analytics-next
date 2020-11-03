const faultyMiddleware = {
  name: 'Fails to run before',
  type: 'before',
  version: '1.0',

  load: async () => {},
  isLoaded: () => true,

  track(ctx) {
    if (ctx.event.context?.attempts < 4) {
      throw new Error('aaay')
    }

    return ctx
  },
}

window.analytics.register(faultyMiddleware)
