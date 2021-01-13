import { Analytics } from './analytics'
import { Context } from './core/context'
import { validation } from './extensions/validation'
import { analyticsNode } from './extensions/analytics-node'
import { Extension } from './core/extension'
import { EventQueue } from './core/queue/event-queue'
import { PriorityQueue } from './lib/priority-queue'

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
      type: 'after' as Extension['type'],
      version: 'latest',
    }

    const ctx = await analytics.register(
      ...[validation, analyticsNode(nodeSettings)]
    )
    analytics.emit('initialize', settings, cookieOptions ?? {})

    return [analytics, ctx]
  }
}
