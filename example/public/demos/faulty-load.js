const faultyLoad = {
  name: 'Fails to load',
  type: 'destination',
  version: '1.0',

  load: () => {
    return new Promise((_res, rej) => {
      setTimeout(() => {
        rej(new Error('aaay'))
      }, 2000)
    })
  },

  isLoaded: () => false,
}

await window.analytics.register(faultyLoad)
