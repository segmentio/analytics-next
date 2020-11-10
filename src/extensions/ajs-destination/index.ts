import { Integrations } from '@/core/events'
import { Alias, Group, Identify, Page, Track } from '@segment/facade'
import pWhilst from 'p-whilst'
import { LegacySettings } from '../../browser'
import { isOffline, isOnline } from '../../core/connection'
import { Context } from '../../core/context'
import { isServer } from '../../core/environment'
import { Extension } from '../../core/extension'
import { attempt } from '../../core/queue/delivery'
import { applyDestinationEdgeFns, DestinationEdgeFunction, EdgeFunction } from '../../extensions/edge-functions/index'
import { asPromise } from '../../lib/as-promise'
import { PriorityQueue } from '../../lib/priority-queue'
import { PersistedPriorityQueue } from '../../lib/priority-queue/persisted'
import { loadIntegration, resolveVersion } from './loader'
import { LegacyIntegration } from './types'

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
  failedQueue.map((failed) => queue.pushWithBackoff(failed))
  return queue
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

export function ajsDestination(name: string, version: string, settings?: object, edgeFns: EdgeFunction[] = []): Extension {
  let buffer: PriorityQueue<Context> = new PersistedPriorityQueue(4, `dest-${name}`)
  let flushing = false

  let integration: LegacyIntegration
  let ready = false
  let onReady = Promise.resolve()

  const type = name === 'Segment.io' ? 'after' : 'destination'

  const xt: Extension = {
    name,
    type,
    version,

    isLoaded: () => ready,
    ready: () => onReady,

    load: async (ctx, analyticsInstance) => {
      integration = await loadIntegration(ctx, analyticsInstance, name, version, settings)

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

      const event = new Track(await applyDestinationEdgeFns({ ...ctx.event }, edgeFns), {})

      // Not sure why Segment.io use a different name than every other integration
      if (integration.ontrack) {
        await asPromise(integration.ontrack(event))
      } else if (integration.track) {
        await asPromise(integration.track(event))
      }

      return ctx
    },

    async identify(ctx) {
      ctx = embedMetrics(name, ctx)

      if (!ready || isOffline()) {
        buffer.push(ctx)
        return ctx
      }

      const event = new Identify(await applyDestinationEdgeFns({ ...ctx.event }, edgeFns), {})

      if (integration.onidentify) {
        await asPromise(integration.onidentify(event))
      } else if (integration.identify) {
        await asPromise(integration.identify(event))
      }

      return ctx
    },

    async page(ctx) {
      ctx = embedMetrics(name, ctx)

      if (!ready || isOffline()) {
        buffer.push(ctx)
        return ctx
      }

      const event = new Page(await applyDestinationEdgeFns({ ...ctx.event }, edgeFns), {})

      if (integration.onpage) {
        await asPromise(integration.onpage(event))
      } else if (integration.page) {
        await asPromise(integration.page(event))
      }

      return ctx
    },

    async alias(ctx) {
      ctx = embedMetrics(name, ctx)

      if (!ready || isOffline()) {
        buffer.push(ctx)
        return ctx
      }

      const event = new Alias(await applyDestinationEdgeFns({ ...ctx.event }, edgeFns), {})

      if (integration.onalias) {
        await asPromise(integration.onalias(event))
      } else if (integration.alias) {
        await asPromise(integration.alias(event))
      }

      return ctx
    },

    async group(ctx) {
      ctx = embedMetrics(name, ctx)

      if (!ready || isOffline()) {
        buffer.push(ctx)
        return ctx
      }

      const event = new Group(await applyDestinationEdgeFns({ ...ctx.event }, edgeFns), {})

      if (integration.ongroup) {
        await asPromise(integration.ongroup(event))
      } else if (integration.group) {
        await asPromise(integration.group(event))
      }

      return ctx
    },
  }

  const scheduleFlush = (): void => {
    if (flushing) {
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      flushing = true
      buffer = await flushQueue(xt, buffer)
      flushing = false
      scheduleFlush()
    }, Math.random() * 5000)
  }

  scheduleFlush()

  return xt
}

export async function ajsDestinations(
  settings: LegacySettings,
  globalIntegrations: Integrations = {},
  destinationEdgeFns: DestinationEdgeFunction = {}
): Promise<Extension[]> {
  if (isServer()) {
    return []
  }

  return Object.entries(settings.integrations)
    .map(([name, settings]) => {
      const allDisableAndNotDefined = globalIntegrations.All === false && globalIntegrations[name] === undefined

      if (globalIntegrations[name] === false || allDisableAndNotDefined) {
        return
      }

      if (settings.type !== 'browser' && name !== 'Segment.io') {
        return
      }

      const edgeFns = destinationEdgeFns[name]
      const version = resolveVersion(settings)
      return ajsDestination(name, version, settings as object, edgeFns)
    })
    .filter((xt) => xt !== undefined) as Extension[]
}
