import { Context } from './core/context'
import { EventQueue } from './core/queue/event-queue'
import { Group, User } from './core/user'
import { ajsDestinations } from './extensions/ajs-destination'
import { edgeFunctions } from './extensions/edge-functions'
import { pageEnrichment } from './extensions/page-enrichment'
import { validation } from './extensions/validation'
import { Analytics, AnalyticsSettings, InitOptions } from './analytics'
import fetch from 'unfetch'

export { ajsDestination } from './extensions/ajs-destination'

export interface LegacyIntegrationConfiguration {
  type?: string
  // The version field is temporary as some sources were not rebuilt yet.
  version?: string
  versionSettings?: {
    version?: string
    override?: string
  }
}

export interface LegacySettings {
  integrations: {
    [name: string]: LegacyIntegrationConfiguration
  }
  edgeFunction: {
    downloadURL?: string
  }
}

export class AnalyticsBrowser {
  static async load(settings: AnalyticsSettings, options?: InitOptions): Promise<[Analytics, Context]> {
    const queue = new EventQueue()
    const cookieOptions = options?.cookie

    const user = new User(options?.user, cookieOptions).load()
    const group = new Group(options?.group, cookieOptions).load()

    const analytics = new Analytics(settings, options ?? {}, queue, user, group)

    const extensions = settings.extensions ?? []
    const legacySettings = await AnalyticsBrowser.loadLegacySettings(settings.writeKey)

    const remoteExtensions = process.env.NODE_ENV !== 'test' ? await ajsDestinations(legacySettings, analytics.integrations) : []
    const edgeFuncs = await edgeFunctions(legacySettings)

    const toRegister = [validation, pageEnrichment, ...edgeFuncs, ...extensions, ...remoteExtensions]
    const ctx = await analytics.register(...toRegister)

    analytics.emit('initialize', settings, options ?? {})

    return [analytics, ctx]
  }

  static async standalone(writeKey: string, options?: InitOptions): Promise<Analytics> {
    const [analytics] = await AnalyticsBrowser.load({ writeKey }, options)
    return analytics
  }

  private static async loadLegacySettings(writeKey: string): Promise<LegacySettings> {
    const legacySettings: LegacySettings = {
      integrations: {},
      edgeFunction: {
        downloadURL: undefined,
      },
    }

    try {
      return await fetch(`https://cdn-settings.segment.com/v1/projects/${writeKey}/settings`).then((res) => res.json())
    } catch (err) {
      // proceed with default legacy settings
      console.warn('Failed to load legacy settings', err)
    }

    return Promise.resolve(legacySettings)
  }
}
