import { AnalyticsNode, NodeContext } from '../../app/analytics-node'

/** Tester helper that resolves context from emitter event */
export const resolveCtx = (
  analytics: AnalyticsNode,
  eventName: 'track' | 'identify' | 'page' | 'screen' | 'group' | 'alias',
  { log = false } = {}
): Promise<NodeContext> => {
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
