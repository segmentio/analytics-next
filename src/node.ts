import { Analytics } from './analytics'
import { Context } from './core/context'
import { validation } from './extensions/validation'
import { analyticsNode } from './extensions/analytics-node'
import { Extension } from './core/extension'

export class AnalyticsNode {
  static async load(settings: { writeKey: string }): Promise<[Analytics, Context]> {
    const options = {
      persist: false,
    }

    const analytics = new Analytics(settings, { user: options, group: options })

    const nodeSettings = {
      writeKey: settings.writeKey,
      name: 'analytics-node-next',
      type: 'after' as Extension['type'],
      version: 'latest',
    }

    const ctx = await analytics.register(...[validation, analyticsNode(nodeSettings)])
    analytics.emit('initialize', settings, options ?? {})

    return [analytics, ctx]
  }
}
