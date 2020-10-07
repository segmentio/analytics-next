import { Context } from '../context'
import pTimeout from 'p-timeout'
import { asPromise } from '../../lib/as-promise'

export type Callback = (ctx: Context) => Promise<unknown> | unknown

export function invokeCallback(ctx: Context, callback?: Callback, timeout?: number): Promise<Context> {
  if (!callback) {
    return Promise.resolve(ctx)
  }

  const cb = async () => await asPromise(callback(ctx))

  return pTimeout(cb(), timeout ?? 1000)
    .catch((err) => {
      ctx?.log('warn', 'Callback Error', { error: err })
      ctx?.stats.increment('callback_error')
    })
    .then(() => ctx)
}
