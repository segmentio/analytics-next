/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Integrations } from '@/core/events'
import { Identify } from '@segment/facade/dist/identify'
import { Track } from '@segment/facade/dist/track'
import pWhilst from 'p-whilst'
import { isOffline, isOnline } from '../../core/connection'
import { Context } from '../../core/context'
import { Emitter } from '../../core/emitter'
import { isServer } from '../../core/environment'
import { Extension } from '../../core/extension'
import { attempt } from '../../core/queue/delivery'
import { User } from '../../core/user'
import { Analytics } from '../../analytics'
import { asPromise } from '../../lib/as-promise'
import { loadScript } from '../../lib/load-script'
import { PriorityQueue } from '../../lib/priority-queue'
import { LegacySettings, LegacyIntegrationConfiguration } from '../../browser'

export interface LegacyIntegration extends Emitter {
  analytics?: Analytics
  initialize: () => void
  loaded: () => boolean

  track?: (event: typeof Track) => void | Promise<void>
  identify?: (event: typeof Identify) => void | Promise<void>

  // Segment.io specific
  ontrack?: (event: typeof Track) => void | Promise<void>
  onidentify?: (event: typeof Identify) => void | Promise<void>
}

const path = process.env.LEGACY_INTEGRATIONS_PATH ?? 'https://cdn.segment.build/next-integrations'

async function flushQueue(xt: Extension, queue: PriorityQueue<Context>): Promise<PriorityQueue<Context>> {
  const failedQueue: Context[] = []

  await pWhilst(
    () => queue.length > 0 && isOnline(),
    async () => {
      const ctx = queue.pop()
      if (!ctx) {
        return
      }

      const result = await attempt(ctx, xt)
      const success = result instanceof Context
      if (!success) {
        failedQueue.push(ctx)
      }
    }
  )

  // re-add failed tasks
  failedQueue.map((failed) => queue.push(failed))
  return queue
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace('.', '').replace(/\s+/g, '-')
}

function embedMetrics(name: string, ctx: Context): Context {
  if (name !== 'Segment.io') {
    return ctx
  }

  // embed metrics into segment event context
  // It could be an enrichment with a before/after flag, and the 'after' type would run here.
  const metrics = ctx.stats.serialize()
  ctx.updateEvent('context.metrics', metrics)

  return ctx
}

export function ajsDestination(name: string, version: string, settings?: object): Extension {
  let buffer: PriorityQueue<Context> = new PriorityQueue(3, [])
  let flushing = false

  let integration: LegacyIntegration
  let ready = false
  let onReady = Promise.resolve()

  const type = name === 'Segment.io' ? 'after' : 'destination'

  const xt: Extension = {
    name,
    type,
    version,

    isLoaded: () => {
      return ready
    },

    ready: async () => {
      return onReady
    },

    load: async (_ctx, analyticsInstance) => {
      const pathName = normalizeName(name)
      const fullPath = `${path}/${pathName}/${version}/${pathName}.dynamic.js.gz`

      try {
        await loadScript(fullPath)
        const [metric] = window?.performance.getEntriesByName(fullPath, 'resource') ?? []

        // we assume everything that took under 100ms is cached
        metric &&
          _ctx.stats.gauge('legacy_destination_time', Math.round(metric.duration), [name, ...(metric.duration < 100 ? ['cached'] : [])])
      } catch (err) {
        _ctx.stats.gauge('legacy_destination_time', -1, [`extension:${name}`, `failed`])
        throw err
      }

      // @ts-ignore
      const deps: string[] = window[`${pathName}Deps`]
      await Promise.all(deps.map((dep) => loadScript(path + dep + '.gz')))

      // @ts-ignore
      window[`${pathName}Loader`]()

      // @ts-ignore
      let integrationBuilder = window[`${pathName}Integration`]

      // GA and Appcues use a different interface to instantiating integrations
      if (integrationBuilder.Integration) {
        const analyticsStub = {
          user: (): User => analyticsInstance.user(),
          addIntegration: (): void => {},
        }

        integrationBuilder(analyticsStub)
        integrationBuilder = integrationBuilder.Integration
      }

      integration = new integrationBuilder(settings)
      integration.analytics = analyticsInstance

      onReady = new Promise((resolve) => {
        integration.once('ready', () => {
          ready = true
          resolve()
        })
      })

      integration.initialize()
    },

    async track(ctx) {
      ctx = embedMetrics(name, ctx)

      if (!ready || isOffline()) {
        buffer.push(ctx)
        return ctx
      }

      // @ts-ignore
      const trackEvent = new Track(ctx.event, {})

      // Not sure why Segment.io use a different name than every other integration
      if (integration.ontrack) {
        await asPromise(integration.ontrack(trackEvent))
      } else if (integration.track) {
        await asPromise(integration.track(trackEvent))
      }

      return ctx
    },

    async identify(ctx) {
      ctx = embedMetrics(name, ctx)

      if (!ready || isOffline()) {
        buffer.push(ctx)
        return ctx
      }
      // @ts-ignore
      const trackEvent = new Identify(ctx.event, {})

      if (integration.onidentify) {
        await asPromise(integration.onidentify(trackEvent))
      } else if (integration.identify) {
        await asPromise(integration.identify(trackEvent))
      }

      return ctx
    },
  }

  const scheduleFlush = (): void => {
    if (flushing || isOffline()) {
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      flushing = true
      buffer = await flushQueue(xt, buffer)
      flushing = false
      scheduleFlush()
    }, Math.random() * 10000)
  }

  scheduleFlush()

  return xt
}

/**
 * resolveVersion should be a temporary function. As not all sources have been
 * rebuilt and we're constantly changing the CDN settings file, we cannot
 * guarantee which `version` field (`version` or `versionSettings`) will be
 * available.
 */
function resolveVersion(settings: LegacyIntegrationConfiguration): string {
  let version = 'latest'
  if (settings.version) version = settings.version

  if (settings.versionSettings) {
    version = settings.versionSettings.override ?? settings.versionSettings.version ?? 'latest'
  }

  return version
}

export async function ajsDestinations(settings: LegacySettings, globalIntegrations: Integrations = {}): Promise<Extension[]> {
  if (globalIntegrations['All'] === false || isServer()) {
    return []
  }

  return Object.entries(settings.integrations)
    .map(([name, settings]) => {
      if (globalIntegrations[name] === false) {
        return
      }

      if (settings.type !== 'browser' && name !== 'Segment.io') {
        return
      }

      const version = resolveVersion(settings)
      return ajsDestination(name, version, settings as object)
    })
    .filter((xt) => xt !== undefined) as Extension[]
}
