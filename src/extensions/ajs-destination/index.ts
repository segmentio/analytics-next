import { Integrations, SegmentEvent } from '@/core/events'
import { Alias, Facade, Group, Identify, Page, Track } from '@segment/facade'
import { Analytics, InitOptions } from '../../analytics'
import { LegacySettings } from '../../browser'
import { isOffline, isOnline } from '../../core/connection'
import { Context, ContextCancelation } from '../../core/context'
import { isServer } from '../../core/environment'
import { Extension } from '../../core/extension'
import { attempt } from '../../core/queue/delivery'
import { asPromise } from '../../lib/as-promise'
import { pWhile } from '../../lib/p-while'
import { PriorityQueue } from '../../lib/priority-queue'
import { PersistedPriorityQueue } from '../../lib/priority-queue/persisted'
import { applyDestinationMiddleware, DestinationMiddlewareFunction } from '../middleware'
import { tsubMiddleware } from '../routing-middleware'
import { loadIntegration, resolveVersion } from './loader'
import { LegacyIntegration } from './types'

const klona = (evt: SegmentEvent): SegmentEvent => JSON.parse(JSON.stringify(evt))

export type ClassType<T> = new (...args: unknown[]) => T

async function flushQueue(xt: Extension, queue: PriorityQueue<Context>): Promise<PriorityQueue<Context>> {
  const failedQueue: Context[] = []

  await pWhile(
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

export class LegacyDestination implements Extension {
  name: string
  version: string
  settings: object
  options: InitOptions
  type: Extension['type'] = 'destination'
  middleware: DestinationMiddlewareFunction[] = []

  private _ready = false
  private onReady: Promise<unknown> | undefined
  integration: LegacyIntegration | undefined

  buffer: PriorityQueue<Context>
  flushing = false

  constructor(name: string, version: string, settings: object = {}, options: InitOptions) {
    this.name = name
    this.version = version
    this.settings = settings
    this.options = options
    this.buffer = new PersistedPriorityQueue(4, `dest-${name}`)

    this.scheduleFlush()
  }

  isLoaded(): boolean {
    return this._ready
  }

  ready(): Promise<unknown> {
    return this.onReady ?? Promise.resolve()
  }

  async load(ctx: Context, analyticsInstance: Analytics): Promise<void> {
    if (this._ready || this.onReady !== undefined) {
      return
    }

    this.integration = await loadIntegration(ctx, analyticsInstance, this.name, this.version, this.settings)
    this.onReady = new Promise((resolve) => {
      this.integration!.once('ready', () => {
        this._ready = true
        resolve(true)
      })
    })

    try {
      ctx.stats.increment('analytics_js.integration.invoke', 1, [`method:initialize`, `integration_name:${this.name}`])
      this.integration.initialize()
    } catch (error) {
      ctx.stats.increment('analytics_js.integration.invoke.error', 1, [`method:initialize`, `integration_name:${this.name}`])
    }
  }

  addMiddleware(...fn: DestinationMiddlewareFunction[]): void {
    this.middleware = this.middleware.concat(...fn)
  }

  private async send<T extends Facade>(ctx: Context, clz: ClassType<T>): Promise<Context> {
    ctx = embedMetrics(this.name, ctx)

    if (!this._ready || isOffline()) {
      this.buffer.push(ctx)
      return ctx
    }

    const plan = this.options?.plan?.track
    const ev = ctx.event.event

    if (plan && ev) {
      const planEvent = plan[ev]

      if (planEvent?.enabled && planEvent.integrations[this.name] === false) {
        ctx.log('debug', 'event dropped by plan', ctx.event)
        ctx.cancel(new ContextCancelation({ retry: false, reason: 'event dropped by plan' }))
        return ctx
      }
    }

    const afterMiddleware = await applyDestinationMiddleware(this.name, klona(ctx.event), this.middleware)

    if (afterMiddleware === null) {
      return ctx
    }

    const event = new clz(afterMiddleware, {})
    const eventType = clz.name.toLowerCase() as 'track' | 'identify' | 'page' | 'alias' | 'group'
    const onEventType = `on${eventType}`

    ctx.stats.increment('analytics_js.integration.invoke', 1, [`method:${eventType}`, `integration_name:${this.name}`])

    try {
      // @ts-expect-error
      if (this.integration && this.integration[onEventType]) {
        // @ts-expect-error
        await asPromise(this.integration[onEventType](event))
      } else if (this.integration && this.integration[eventType]) {
        // @ts-expect-error
        await asPromise(this.integration[eventType](event))
      }
    } catch (err) {
      ctx.stats.increment('analytics_js.integration.invoke.error', 1, [`method:${eventType}`, `integration_name:${this.name}`])
      throw err
    }

    return ctx
  }

  async track(ctx: Context): Promise<Context> {
    return this.send(ctx, Track as ClassType<Track>)
  }

  async page(ctx: Context): Promise<Context> {
    return this.send(ctx, Page as ClassType<Page>)
  }

  async identify(ctx: Context): Promise<Context> {
    return this.send(ctx, Identify as ClassType<Identify>)
  }

  async alias(ctx: Context): Promise<Context> {
    return this.send(ctx, Alias as ClassType<Alias>)
  }

  async group(ctx: Context): Promise<Context> {
    return this.send(ctx, Group as ClassType<Group>)
  }

  private scheduleFlush(): void {
    if (this.flushing) {
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      this.flushing = true
      this.buffer = await flushQueue(this, this.buffer)
      this.flushing = false
      this.scheduleFlush()
    }, Math.random() * 5000)
  }
}

export async function ajsDestinations(
  settings: LegacySettings,
  globalIntegrations: Integrations = {},
  options?: InitOptions
): Promise<LegacyDestination[]> {
  if (isServer()) {
    return []
  }

  const routingRules = settings.middlewareSettings?.routingRules ?? []
  const routingMiddleware = tsubMiddleware(routingRules)

  return Object.entries(settings.integrations)
    .map(([name, integrationSettings]) => {
      const allDisableAndNotDefined = globalIntegrations.All === false && globalIntegrations[name] === undefined

      if (globalIntegrations[name] === false || allDisableAndNotDefined) {
        return
      }

      if (integrationSettings.type !== 'browser' && name !== 'Segment.io') {
        return
      }

      const version = resolveVersion(integrationSettings)
      const destination = new LegacyDestination(name, version, integrationSettings, options as object)

      const routing = routingRules.filter((rule) => rule.destinationName === name)
      if (routing.length > 0) {
        destination.addMiddleware(routingMiddleware)
      }

      return destination
    })
    .filter((xt) => xt !== undefined) as LegacyDestination[]
}
