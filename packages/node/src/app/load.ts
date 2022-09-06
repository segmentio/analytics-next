import { validation } from '@segment/analytics-plugin-validation'
import { PriorityQueue, EventQueue } from '@segment/analytics-core'
import {
  AnalyticsNode,
  NodeContext,
  InitOptions,
  AnalyticsSettings,
} from './analytics-node'
import { analyticsNode, AnalyticsNodePluginSettings } from './plugin'

export async function load(
  settings: AnalyticsSettings,
  options: InitOptions = {}
): Promise<[AnalyticsNode, NodeContext]> {
  const queue = new EventQueue(new PriorityQueue(3, []))

  const analytics = new AnalyticsNode(settings, options, queue)

  const nodeSettings: AnalyticsNodePluginSettings = {
    name: 'analytics-node-next',
    type: 'after',
    version: 'latest',
    writeKey: settings.writeKey,
  }

  // TODO: this shouldn't be asnyc??? this is a regression
  const ctx = await analytics.register(validation, analyticsNode(nodeSettings))

  analytics.emit('initialize', settings)

  return [analytics, ctx]
}
