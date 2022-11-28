import { EventEmitter } from 'events'

/**
 * adapted from: https://www.npmjs.com/package/node-abort-controller
 */
class AbortSignalPolyfill {
  onabort: AbortSignal['onabort']
  eventEmitter = new EventEmitter()
  aborted: AbortSignal['aborted']
  constructor() {
    this.onabort = null
    this.aborted = false
  }
  toString() {
    return '[object AbortSignal]'
  }
  get [Symbol.toStringTag]() {
    return 'AbortSignal'
  }
  removeEventListener(...args: Parameters<EventEmitter['removeListener']>) {
    this.eventEmitter.removeListener(...args)
  }
  addEventListener(...args: Parameters<EventEmitter['addListener']>) {
    this.eventEmitter.on(...args)
  }

  // this method isn't the same as the dom method, and it doesn't return a boolean
  dispatchEvent(type: string) {
    const event = { type, target: this }

    const handlerName = `on${event.type}`

    // @ts-ignore
    if (typeof this[handlerName] === 'function') this[handlerName](event)

    this.eventEmitter.emit(event.type, event)
  }
}

/**
 * This polyfill is neccessary to support node 14.
 */
class AbortControllerPolyfill {
  signal = new AbortSignalPolyfill()
  abort() {
    if (this.signal.aborted) return

    this.signal.aborted = true
    this.signal.dispatchEvent('abort')
  }
  toString() {
    return '[object AbortController]'
  }
  get [Symbol.toStringTag]() {
    return 'AbortController'
  }
}

/**
 * @param timeoutMs - Set a request timeout, after which the request is cancelled.
 */
export const abortSignalAfterTimeout = (timeoutMs: number): AbortSignal => {
  const controller = globalThis.AbortController
    ? new globalThis.AbortController()
    : new AbortControllerPolyfill()

  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  // Allow Node.js processes to exit early if only the timeout is running
  timeoutId?.unref?.()

  return controller.signal as AbortSignal
}
