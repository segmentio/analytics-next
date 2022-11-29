import { EventEmitter } from 'events'
/**
 * adapted from: https://www.npmjs.com/package/node-abort-controller
 */
const abortSignal =
  global.AbortSignal ||
  class AbortSignal {
    onabort: Function | null
    eventEmitter = new EventEmitter()
    aborted: boolean
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
const abortController =
  global.AbortController ||
  class AbortController {
    signal = new abortSignal()
    abort() {
      if (this.signal.aborted) return

      // @ts-ignore
      this.signal.aborted = true
      // @ts-ignore
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
export const abortSignalAfterTimeout = (timeoutMs: number) => {
  const ac = new abortController()

  const timeoutId = setTimeout(() => {
    ac.abort()
  }, timeoutMs)

  // Allow Node.js processes to exit early if only the timeout is running
  timeoutId?.unref?.()

  return ac.signal
}
