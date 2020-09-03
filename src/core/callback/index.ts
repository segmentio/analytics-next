import { Context } from '../context'
import pTimeout from 'p-timeout'

function promisify(fn: Function): Promise<unknown> {
  const res = fn()
  return Promise.resolve(res)
}

export type Callback = (ctx: Context) => Promise<unknown> | unknown

export function invokeCallback(ctx: Context, callback?: Callback, timeout?: number): Promise<Context> {
  if (!callback) {
    return Promise.resolve(ctx)
  }

  return pTimeout(
    promisify(() => callback(ctx)),
    timeout ?? 1000
  )
    .catch((err) => {
      ctx.log('warn', 'Callback timeout', { messageId: ctx.event.messageId, error: err })
      ctx.stats.increment('callback_error')
    })
    .then(() => ctx)
}
