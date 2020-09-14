import { Context } from '../context'
import pTimeout from 'p-timeout'

function promisify(fn: Function): Promise<unknown> {
  const res = fn()
  return Promise.resolve(res)
}

export type Callback = (ctx: Context | undefined) => Promise<unknown> | unknown

export function invokeCallback(
  ctx: Context | undefined,
  callback?: Callback,
  timeout?: number
): Promise<Context | undefined> {
  if (!callback) {
    return Promise.resolve(ctx)
  }

  return pTimeout(
    promisify(() => callback(ctx)),
    timeout ?? 1000
  )
    .catch((err) => {
      ctx?.log('warn', 'Callback timeout', { error: err })
      ctx?.stats.increment('callback_error')
    })
    .then(() => ctx)
}
