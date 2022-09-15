import { AnalyticsNode, NodeContext } from '../../app/analytics-node'

/** Tester helper that resolves context from emitter event */
export const resolveCtx = (
  analytics: AnalyticsNode,
  eventName: 'track' | 'identify' | 'page' | 'screen' | 'group' | 'alias',
  { log = true } = {}
): Promise<NodeContext> => {
  return new Promise((resolve, reject) => {
    analytics.once(eventName, resolve)
    analytics.once('error', (ctx) => {
      if (typeof ctx === 'object' && typeof ctx['logs'] === 'function') {
        log && console.error(ctx.logs())
      }
      reject(ctx)
    })
  })
}
