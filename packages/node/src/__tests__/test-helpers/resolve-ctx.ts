import { AnalyticsNode, NodeContext } from '../../app/analytics-node'

/** Tester helper that resolves context from emitter event */
export const resolveCtx = (
  analytics: AnalyticsNode,
  eventName: 'track' | 'identify' | 'page' | 'screen' | 'group' | 'alias'
): Promise<NodeContext> => {
  return new Promise((resolve) => analytics.on(eventName, resolve))
}
