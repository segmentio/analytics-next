export function getGlobal() {
  // see https://mathiasbynens.be/notes/globalthis for more details
  if (typeof globalThis === 'object') return
  Object.defineProperty(Object.prototype, '__magic__', {
    get: function () {
      return this
    },
    configurable: true, // This makes it possible to `delete` the getter later.
  })
  // @ts-expect-error defined above
  __magic__.globalThis = __magic__
  // @ts-expect-error defined above
  delete Object.prototype.__magic__
}
