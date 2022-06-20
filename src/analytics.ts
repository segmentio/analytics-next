import { AnalyticsBrowser } from './browser'
import { SegmentEvent } from './core/events'
import type { LegacyIntegration } from './plugins/ajs-destination/types'
import { version } from './generated/version'
import { AnalyticsCore, AnalyticsSettings, InitOptions } from './analytics-core'

const deprecationWarning =
  'This is being deprecated and will be not be available in future releases of Analytics JS'

// reference any pre-existing "analytics" object so a user can restore the reference
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny: any = global
const _analytics = globalAny.analytics

export class Analytics extends AnalyticsCore {
  // analytics-classic api

  noConflict(): Analytics {
    console.warn(deprecationWarning)
    window.analytics = _analytics ?? this
    return this
  }

  normalize(msg: SegmentEvent): SegmentEvent {
    console.warn(deprecationWarning)
    return this.eventFactory.normalize(msg)
  }

  get failedInitializations(): string[] {
    console.warn(deprecationWarning)
    return this.queue.failedInitializations
  }

  get VERSION(): string {
    return version
  }

  async initialize(
    settings?: AnalyticsSettings,
    options?: InitOptions
  ): Promise<Analytics> {
    console.warn(deprecationWarning)
    if (settings) {
      await AnalyticsBrowser.load(settings, options)
    }
    this.options = options || {}
    return this
  }

  init = this.initialize.bind(this)

  async pageview(url: string): Promise<Analytics> {
    console.warn(deprecationWarning)
    await this.page({ path: url })
    return this
  }

  get plugins() {
    console.warn(deprecationWarning)
    // @ts-expect-error
    return this._plugins ?? {}
  }

  get Integrations() {
    console.warn(deprecationWarning)
    const integrations = this.queue.plugins
      .filter((plugin) => plugin.type === 'destination')
      .reduce((acc, plugin) => {
        const name = `${plugin.name
          .toLowerCase()
          .replace('.', '')
          .split(' ')
          .join('-')}Integration`

        // @ts-expect-error
        const integration = window[name] as
          | (LegacyIntegration & { Integration?: LegacyIntegration })
          | undefined

        if (!integration) {
          return acc
        }

        const nested = integration.Integration // hack - Google Analytics function resides in the "Integration" field
        if (nested) {
          acc[plugin.name] = nested
          return acc
        }

        acc[plugin.name] = integration as LegacyIntegration
        return acc
      }, {} as Record<string, LegacyIntegration>)

    return integrations
  }

  // analytics-classic stubs

  log() {
    console.warn(deprecationWarning)
    return
  }

  addIntegrationMiddleware() {
    console.warn(deprecationWarning)
    return
  }

  listeners() {
    console.warn(deprecationWarning)
    return
  }

  addEventListener() {
    console.warn(deprecationWarning)
    return
  }

  removeAllListeners() {
    console.warn(deprecationWarning)
    return
  }

  removeListener() {
    console.warn(deprecationWarning)
    return
  }

  removeEventListener() {
    console.warn(deprecationWarning)
    return
  }

  hasListeners() {
    console.warn(deprecationWarning)
    return
  }

  // This function is only used to add GA and Appcue, but these are already being added to Integrations by AJSN
  addIntegration() {
    console.warn(deprecationWarning)
    return
  }

  add() {
    console.warn(deprecationWarning)
    return
  }
}
