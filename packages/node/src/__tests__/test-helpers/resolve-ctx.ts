import type { Analytics } from '../../app/analytics-node'
import type { Context } from '../../app/context'

/** Tester helper that resolves context from emitter event */
export const resolveCtx = (
  analytics: Analytics,
  eventName: 'track' | 'identify' | 'page' | 'screen' | 'group' | 'alias',
  { log = false } = {}
): Promise<Context> => {
  return new Promise((resolve, reject) => {
    analytics.once(eventName, resolve)
    analytics.once('error', (err) => {
      if (typeof err === 'object' && typeof err.ctx?.['logs'] === 'function') {
        log && console.error(err.ctx.logs())
      }
      reject(err)
    })
  })
}
