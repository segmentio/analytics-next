const signals = {
  name: 'Signals',
  type: 'utility',
  version: '0.1.0',

  load: async (_ctx, analytics) => {
    document.querySelector('#shuffle').addEventListener('click', async () => {
      const ctx = await analytics.track('Event Shuffled')
      ctx.flush()
    })
  },

  isLoaded: () => true,
}

window.analytics.register(signals)
