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
 * @param ctx
 * @param callback - the function to invoke
 * @param delay - aka "timeout". The amount of time in ms to wait before invoking the callback.
 */
export function invokeCallback(
  ctx: CoreContext,
  callback: Callback,
  delay: number
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
      .then(() => pTimeout(cb(), 1000))
      .catch((err) => {
        ctx?.log('warn', 'Callback Error', { error: err })
        ctx?.stats?.increment('callback_error')
      })
      .then(() => ctx)
  )
}
