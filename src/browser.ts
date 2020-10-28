import { Context } from './core/context'
import { EventQueue } from './core/queue/event-queue'
import { Group, User } from './core/user'
import { ajsDestinations } from './extensions/ajs-destination'
import { edgeFunctions } from './extensions/edge-functions'
import { pageEnrichment } from './extensions/page-enrichment'
import { validation } from './extensions/validation'
import { Analytics, AnalyticsSettings, InitOptions } from './analytics'

export class AnalyticsBrowser {
  static async load(settings: AnalyticsSettings, options?: InitOptions): Promise<[Analytics, Context]> {
    const queue = new EventQueue()

    const user = new User(options?.user, options?.cookie).load()
    const group = new Group(options?.group, options?.cookie).load()

    const analytics = new Analytics(settings, options ?? {}, queue, user, group)

    const extensions = settings.extensions ?? []
    const remoteExtensions = process.env.NODE_ENV !== 'test' ? await ajsDestinations(settings.writeKey, analytics.integrations) : []
    const edgeFuncs = process.env.NODE_ENV !== 'test' ? await edgeFunctions(settings.writeKey) : []
    const ctx = await analytics.register(...[validation, pageEnrichment, ...edgeFuncs, ...extensions, ...remoteExtensions])

    analytics.emit('initialize', settings, options ?? {})

    return [analytics, ctx]
  }

  static async standalone(writeKey: string, options?: InitOptions): Promise<Analytics> {
    const [analytics] = await AnalyticsBrowser.load({ writeKey }, options)
    return analytics
  }
}
