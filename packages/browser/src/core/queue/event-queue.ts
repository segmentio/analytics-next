import { Analytics } from '../analytics'
import { groupBy } from '../../lib/group-by'
import { ON_REMOVE_FROM_FUTURE, PriorityQueue } from '../../lib/priority-queue'
import { PersistedPriorityQueue } from '../../lib/priority-queue/persisted'
import { isOnline } from '../connection'
import { Context, ContextCancelation } from '../context'
import { Emitter } from '@segment/analytics-core'
import { Integrations } from '../events'
import { Plugin, PluginConfig } from '../plugin'
import { createTaskGroup, TaskGroup } from '../task/task-group'
import { attempt, ensure } from './delivery'
import { inspectorHost } from '../inspector'

type PluginsByType = {
  before: Plugin[]
  after: Plugin[]
  enrichment: Plugin[]
  destinations: Plugin[]
}

export class EventQueue extends Emitter {
  /**
   * All event deliveries get suspended until all the tasks in this task group are complete.
   * For example: a middleware that augments the event object should be loaded safely as a
   * critical task, this way, event queue will wait for it to be ready before sending events.
   *
   * This applies to all the events already in the queue, and the upcoming ones
   */
  criticalTasks: TaskGroup = createTaskGroup()
  queue: PriorityQueue<Context>
  plugins: Plugin[] = []
  failedInitializations: string[] = []
  private flushing = false

  constructor(priorityQueue?: PriorityQueue<Context>) {
    super()
    this.queue = priorityQueue ?? new PersistedPriorityQueue(4, 'event-queue')
    this.queue.on(ON_REMOVE_FROM_FUTURE, () => {
      this.scheduleFlush(0)
    })
  }

  async register(
    ctx: Context,
    plugin: Plugin,
    instance: Analytics,
    pluginConfig?: PluginConfig
  ): Promise<void> {
    await Promise.resolve(plugin.load(ctx, instance, pluginConfig))
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
    const willDeliver = this.subscribeToDelivery(ctx)
    this.scheduleFlush(0)
    return willDeliver
  }

  private async subscribeToDelivery(ctx: Context): Promise<Context> {
    return new Promise((resolve) => {
      const onDeliver = (flushed: Context, delivered: boolean): void => {
        if (flushed.isSame(ctx)) {
          this.off('flush', onDeliver)
          if (delivered) {
            resolve(flushed)
          } else {
            resolve(flushed)
          }
        }
      }

      this.on('flush', onDeliver)
    })
  }

  async dispatchSingle(ctx: Context): Promise<Context> {
    ctx.log('debug', 'Dispatching')
    ctx.stats.increment('message_dispatched')

    this.queue.updateAttempts(ctx)
    ctx.attempts = 1

    return this.deliver(ctx).catch((err) => {
      if (err instanceof ContextCancelation && err.retry === false) {
        ctx.setFailedDelivery({ reason: err })
        return ctx
      }

      const accepted = this.enqueuRetry(err, ctx)
      if (!accepted) {
        ctx.setFailedDelivery({ reason: err })
        return ctx
      }

      return this.subscribeToDelivery(ctx)
    })
  }

  isEmpty(): boolean {
    return this.queue.length === 0
  }

  private scheduleFlush(timeout = 500): void {
    if (this.flushing) {
      return
    }

    this.flushing = true

    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.flush().then(() => {
        setTimeout(() => {
          this.flushing = false

          if (this.queue.length) {
            this.scheduleFlush(0)
          }
        }, 0)
      })
    }, timeout)
  }

  private async deliver(ctx: Context): Promise<Context> {
    await this.criticalTasks.done()

    const start = Date.now()
    try {
      ctx = await this.flushOne(ctx)
      const done = Date.now() - start
      ctx.stats.gauge('delivered', done)
      ctx.log('debug', 'Delivered', ctx.event)
      return ctx
    } catch (err) {
      ctx.log('error', 'Failed to deliver', err as object)
      ctx.stats.increment('delivery_failed')
      throw err
    }
  }

  private enqueuRetry(err: Error, ctx: Context): boolean {
    const notRetriable =
      err instanceof ContextCancelation && err.retry === false
    const retriable = !notRetriable

    if (retriable) {
      const accepted = this.queue.pushWithBackoff(ctx)
      return accepted
    }

    return false
  }

  async flush(): Promise<Context[]> {
    if (this.queue.length === 0 || !isOnline()) {
      return []
    }

    let ctx = this.queue.pop()
    if (!ctx) {
      return []
    }

    ctx.attempts = this.queue.getAttempts(ctx)

    try {
      ctx = await this.deliver(ctx)
      this.emit('flush', ctx, true)
    } catch (err: any) {
      const accepted = this.enqueuRetry(err, ctx)

      if (!accepted) {
        ctx.setFailedDelivery({ reason: err })
        this.emit('flush', ctx, false)
      }

      return []
    }

    return [ctx]
  }

  private isReady(): boolean {
    // return this.plugins.every((p) => p.isLoaded())
    // should we wait for every plugin to load?
    return true
  }

  private availableExtensions(denyList: Integrations): PluginsByType {
    const available = this.plugins.filter((p) => {
      // Only filter out destination plugins or the Segment.io plugin
      if (p.type !== 'destination' && p.name !== 'Segment.io') {
        return true
      }

      // Explicit integration option takes precedence, `All: false` does not apply to Segment.io
      return (
        denyList[p.name] ??
        (p.name === 'Segment.io' ? true : denyList.All) !== false
      )
    })

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

  private async flushOne(ctx: Context): Promise<Context> {
    if (!this.isReady()) {
      throw new Error('Not ready')
    }

    const { before, enrichment } = this.availableExtensions(
      ctx.event.integrations ?? {}
    )

    for (const beforeWare of before) {
      const temp: Context | undefined = await ensure(ctx, beforeWare)
      if (temp instanceof Context) {
        ctx = temp
      }
    }

    for (const enrichmentWare of enrichment) {
      const temp = await attempt(ctx, enrichmentWare)
      if (temp instanceof Context) {
        ctx = temp
      }
    }

    inspectorHost.enriched?.(ctx as any)

    // Enrichment and before plugins can re-arrange the deny list dynamically
    // so we need to pluck them at the end
    const { destinations, after } = this.availableExtensions(
      ctx.event.integrations ?? {}
    )

    await new Promise((resolve, reject) => {
      setTimeout(() => {
        const attempts = destinations.map((destination) =>
          attempt(ctx, destination)
        )
        Promise.all(attempts).then(resolve).catch(reject)
      }, 0)
    })

    ctx.stats.increment('message_delivered')

    // FIXME: Resolve browsers destinations that the event was sent to
    inspectorHost.delivered?.(ctx as any, ['segment.io'])

    const afterCalls = after.map((after) => attempt(ctx, after))
    await Promise.all(afterCalls)

    return ctx
  }
}
