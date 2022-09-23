import { CoreContext } from '../context'
import type { Callback } from '../events'

export function pTimeout(
  cb: Promise<unknown>,
  timeout: number
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(Error('Promise timed out'))
    }, timeout)

    cb.then((val) => {
      clearTimeout(timeoutId)
      return resolve(val)
    }).catch(reject)
  })
}

function sleep(timeoutInMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeoutInMs))
}

/**
 * @param delay - The amount of time in ms to wait before invoking the callback.
 * Ajs 1.0 worked differently so the delay was meant to give ajs a chance to send the event before invoking the callback.
 * Customers used that behavior to delay navigating to a new page. However, AJS 2.0 resolves a promise once the event has already been sent... so this is likely used to give third party destinations time to flush
 * @param timeout - The maximum amount of time in ms to allow the callback to run for.
 */
export function invokeCallback(
  ctx: CoreContext,
  callback: Callback,
  delay: number,
  timeout?: number
): Promise<CoreContext> {
  const cb = () => {
    try {
      return Promise.resolve(callback(ctx))
    } catch (err) {
      return Promise.reject(err)
    }
  }

  return (
    sleep(delay)
      // pTimeout ensures that the callback can't cause the context to hang
      .then(() => pTimeout(cb(), timeout ?? 1000))
      .catch((err) => {
        ctx?.log('warn', 'Callback Error', { error: err })
        ctx?.stats?.increment('callback_error')
      })
      .then(() => ctx)
  )
}
