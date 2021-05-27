import { Analytics } from '../../analytics'
import { groupBy } from '../../lib/group-by'
import { PriorityQueue } from '../../lib/priority-queue'
import { PersistedPriorityQueue } from '../../lib/priority-queue/persisted'
import { isOnline } from '../connection'
import { Context, ContextCancelation } from '../context'
import { Emitter } from '../emitter'
import { Integrations } from '../events'
import { Plugin } from '../plugin'
import { attempt, ensure } from './delivery'

type PluginsByType = {
  before: Plugin[]
  after: Plugin[]
  enrichment: Plugin[]
  destinations: Plugin[]
}

export class EventQueue extends Emitter {
  queue: PriorityQueue<Context>
  plugins: Plugin[] = []
  failedInitializations: string[] = []
  private flushing = false

  constructor(priorityQueue?: PriorityQueue<Context>) {
    super()
    // todo: should the persisted queue be namespaced with the write key?
    this.queue = priorityQueue ?? new PersistedPriorityQueue(4, 'event-queue')
    this.scheduleFlush()
  }

  async register(
    ctx: Context,
    plugin: Plugin,
    instance: Analytics
  ): Promise<void> {
    await Promise.resolve(plugin.load(ctx, instance))
      .then(() => {
        this.plugins.push(plugin)
      })
      .catch((err) => {
        if (plugin.type === 'destination') {
          this.failedInitializations.push(plugin.name)
          console.warn(plugin.name, err)

          ctx.log('warn', 'Failed to load destination', {
            plugin: plugin.name,
            error: err,
          })

          return
        }

        throw err
      })
  }

  async deregister(
    ctx: Context,
    plugin: Plugin,
    instance: Analytics
  ): Promise<void> {
    try {
      if (plugin.unload) {
        await Promise.resolve(plugin.unload(ctx, instance))
      }

      this.plugins = this.plugins.filter((p) => p.name !== plugin.name)
    } catch (e) {
      ctx.log('warn', 'Failed to unload destination', {
        plugin: plugin.name,
        error: e,
      })
    }
  }

  async dispatch(ctx: Context): Promise<Context> {
    ctx.log('debug', 'Dispatching')
    ctx.stats.increment('message_dispatched')

    this.queue.push(ctx)
    this.scheduleFlush(0)

    return new Promise((resolve, reject) => {
      const onDeliver = (flushed: Context, delivered: boolean): void => {
        if (flushed.isSame(ctx)) {
          this.off('flush', onDeliver)
          if (delivered) {
            resolve(flushed)
          } else {
            reject(flushed)
          }
        }
      }

      this.on('flush', onDeliver)
    })
  }

  private scheduleFlush(timeout = 500): void {
    if (this.flushing) {
      return
    }

    this.flushing = true

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      await this.flush()
      this.flushing = false

      if (this.queue.length) {
        this.scheduleFlush(0)
      } else {
        this.scheduleFlush(500)
      }
    }, timeout)
  }

  async flush(): Promise<Context[]> {
    const failed: Context[] = []
    const toFlush: Context[] = []

    if (this.queue.length === 0 || !isOnline()) {
      return []
    }

    const ctx = this.queue.pop()
    if (!ctx) {
      return []
    }

    ctx.attempts = this.queue.getAttempts(ctx)
    toFlush.push(ctx)
    const start = Date.now()

    try {
      await this.flushOne(ctx)
      const done = Date.now() - start
      ctx.stats.gauge('delivered', done)
      ctx.log('debug', 'Delivered', ctx.event)

      this.emit('flush', ctx, true)
    } catch (err) {
      ctx.log('error', 'Failed to deliver', err)
      ctx.stats.increment('delivery_failed')

      const notRetriable =
        err instanceof ContextCancelation && err.retry === false
      const retriable = !notRetriable
      retriable && failed.push(ctx)

      // re-queue all failed
      failed.forEach((ctx) => {
        const accepted = this.queue.pushWithBackoff(ctx)
        if (!accepted) {
          this.emit('flush', ctx, false)
        }
      })

      return []
    }

    return [ctx]
  }

  private isReady(): boolean {
    // return this.plugins.every((p) => p.isLoaded())
    // should we wait for every plugin to load?
    return true
  }

  private availableExtensios(denyList: Integrations): PluginsByType {
    const available = this.plugins.filter((p) => denyList[p.name] !== false)
    const {
      before = [],
      enrichment = [],
      destination = [],
      after = [],
    } = groupBy(available, 'type')

    return {
      before,
      enrichment,
      destinations: destination,
      after,
    }
  }

  private async flushOne(ctx: Context): Promise<Context | undefined> {
    if (!this.isReady()) {
      throw new Error('Not ready')
    }

    const denyList = ctx.event.integrations ?? {}
    const { before, enrichment, destinations, after } = this.availableExtensios(
      denyList
    )

    for (const beforeWare of before) {
      const temp: Context | undefined = await ensure(ctx, beforeWare)
      if (temp !== undefined) {
        ctx = temp
      }
    }

    // TODO: should enrichment halt the pipeline?
    // TODO: should enrichment be run in parallel?
    for (const enrichmentWare of enrichment) {
      const temp: Context | Error | undefined = await attempt(
        ctx,
        enrichmentWare
      )
      if (temp instanceof Context) {
        ctx = temp
      }
    }

    // TODO: concurrency control
    // TODO: timeouts

    await new Promise((resolve, reject) => {
      setTimeout(() => {
        const attempts = destinations.map((destination) =>
          attempt(ctx, destination)
        )
        Promise.all(attempts).then(resolve).catch(reject)
      }, 0)
    })

    ctx.stats.increment('message_delivered')

    const afterCalls = after.map((after) => attempt(ctx, after))
    await Promise.all(afterCalls)

    return ctx
  }
}
