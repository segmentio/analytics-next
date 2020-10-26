import { Analytics } from './index'
import { Context } from './core/context'
import { Group, User } from './core/user'
import { EventQueue } from './core/queue/event-queue'
import { validation } from './extensions/validation'
import { analyticsNode } from './extensions/analytics-node'
import { Extension } from './core/extension'

export class AnalyticsNode {
  static async load(settings: { writeKey: string }): Promise<[Analytics, Context]> {
    const queue = new EventQueue()

    const options = {
      persist: false,
    }

    const user = new User(options).load()
    const group = new Group(options).load()

    const analytics = new Analytics(settings, { user: options, group: options }, queue, user, group)

    const analyticsNodeSettings = {
      writeKey: settings.writeKey,
      name: 'analytics-node-next',
      type: 'after' as Extension['type'],
      version: 'latest',
    }

    const ctx = await analytics.register(...[validation, analyticsNode(analyticsNodeSettings)])

    analytics.emit('initialize', settings, options ?? {})

    return [analytics, ctx]
  }
}
