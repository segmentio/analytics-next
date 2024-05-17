import { Analytics } from '../core/analytics'
import { Context } from '../core/context'
import { analyticsNode } from '../plugins/analytics-node'
import { Plugin } from '../core/plugin'
import { EventQueue } from '../core/queue/event-queue'
import { PriorityQueue } from '../lib/priority-queue'

/**
 * @deprecated Please use the standalone `@segment/analytics-node` package.
 */
export class AnalyticsNode {
  static async load(settings: {
    writeKey: string
  }): Promise<[Analytics, Context]> {
    const cookieOptions = {
      persist: false,
    }

    const queue = new EventQueue(new PriorityQueue(3, []))
    const options = { user: cookieOptions, group: cookieOptions }
    const analytics = new Analytics(settings, options, queue)

    const nodeSettings = {
      writeKey: settings.writeKey,
      name: 'analytics-node-next',
      type: 'after' as Plugin['type'],
      version: 'latest',
    }

    const ctx = await analytics.register(analyticsNode(nodeSettings))
    analytics.emit('initialize', settings, cookieOptions ?? {})

    return [analytics, ctx]
  }
}
