import { Context } from './core/context'
import { EventQueue } from './core/queue/event-queue'
import { Group, User } from './core/user'
import { ajsDestinations } from './extensions/ajs-destination'
import { edgeFunctions } from './extensions/edge-functions'
import { pageEnrichment } from './extensions/page-enrichment'
import { validation } from './extensions/validation'
import { Analytics, AnalyticsSettings, InitOptions } from './analytics'

export { ajsDestination } from './extensions/ajs-destination'

export class AnalyticsBrowser {
  static async load(settings: AnalyticsSettings, options?: InitOptions): Promise<[Analytics, Context]> {
    const queue = new EventQueue()
    const cookieOptions = options?.cookie

    const user = new User(options?.user, cookieOptions).load()
    const group = new Group(options?.group, cookieOptions).load()

    const analytics = new Analytics(settings, options ?? {}, queue, user, group)

    const extensions = settings.extensions ?? []
    const writeKey = settings.writeKey

    const remoteExtensions = process.env.NODE_ENV !== 'test' ? await ajsDestinations(writeKey, analytics.integrations) : []
    const edgeFuncs = await edgeFunctions(writeKey)

    const toRegister = [validation, pageEnrichment, ...edgeFuncs, ...extensions, ...remoteExtensions]
    const ctx = await analytics.register(...toRegister)

    analytics.emit('initialize', settings, options ?? {})

    return [analytics, ctx]
  }

  static async standalone(writeKey: string, options?: InitOptions): Promise<Analytics> {
    const [analytics] = await AnalyticsBrowser.load({ writeKey }, options)
    return analytics
  }
}
