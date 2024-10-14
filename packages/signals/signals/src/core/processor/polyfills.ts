const globalThisPolyfill = `(function () {
  // polyfill for globalThis
  if (typeof globalThis === 'undefined') {
    if (typeof self !== 'undefined') {
      self.globalThis = self
    } else if (typeof window !== 'undefined') {
      window.globalThis = window
    } else if (typeof global !== 'undefined') {
      global.globalThis = global
    } else {
      throw new Error('Unable to locate global object')
    }
  }
})()`

export const polyfills = [globalThisPolyfill].join('\n')
