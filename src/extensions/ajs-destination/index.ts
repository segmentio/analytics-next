import { Integrations, SegmentEvent } from '@/core/events'
import { Alias, Facade, Group, Identify, Page, Track } from '@segment/facade'
import pWhilst from 'p-whilst'
import { Analytics } from '../../analytics'
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
import { applyDestinationMiddleware, DestinationMiddlewareFunction } from '../middleware'
import { loadIntegration, resolveVersion } from './loader'
import { LegacyIntegration } from './types'

const klona = (evt: SegmentEvent): SegmentEvent => JSON.parse(JSON.stringify(evt))

export type ClassType<T> = new (...args: unknown[]) => T

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

export class LegacyDestination implements Extension {
  name: string
  version: string
  settings: object
  type: Extension['type'] = 'destination'
  edgeFunctions: EdgeFunction[] = []
  middleware: DestinationMiddlewareFunction[] = []

  private _ready = false
  private onReady: Promise<unknown> = Promise.resolve()
  integration: LegacyIntegration | undefined

  buffer: PriorityQueue<Context>
  flushing = false

  constructor(name: string, version: string, settings: object = {}) {
    this.name = name
    this.version = version
    this.settings = settings
    this.buffer = new PersistedPriorityQueue(4, `dest-${name}`)

    this.scheduleFlush()
  }

  isLoaded(): boolean {
    return this._ready
  }

  ready(): Promise<unknown> {
    return this.onReady
  }

  async load(ctx: Context, analyticsInstance: Analytics): Promise<void> {
    this.integration = await loadIntegration(ctx, analyticsInstance, this.name, this.version, this.settings)

    this.onReady = new Promise((resolve) => {
      this.integration!.once('ready', () => {
        this._ready = true
        resolve()
      })
    })

    this.integration.initialize()
  }

  addEdgeFunctions(...edgeFunctions: EdgeFunction[]): void {
    this.edgeFunctions = this.edgeFunctions.concat(...edgeFunctions)
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

    const withEdgeFns = await applyDestinationEdgeFns(klona(ctx.event), this.edgeFunctions)
    const afterMiddleware = await applyDestinationMiddleware(this.name, klona(withEdgeFns), this.middleware)

    const event = new clz(afterMiddleware, {})

    const eventType = clz.name.toLowerCase() as 'track' | 'identify' | 'page' | 'alias' | 'group'
    const onEventType = `on${eventType}`

    // @ts-expect-error
    if (this.integration && this.integration[onEventType]) {
      // @ts-expect-error
      await asPromise(this.integration[onEventType](event))
    } else if (this.integration && this.integration[eventType]) {
      // @ts-expect-error
      await asPromise(this.integration[eventType](event))
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

      const edgeFns = destinationEdgeFns[name] ?? []
      const version = resolveVersion(settings)

      const destination = new LegacyDestination(name, version, settings as object)
      destination.addEdgeFunctions(...edgeFns)

      return destination
    })
    .filter((xt) => xt !== undefined) as Extension[]
}
