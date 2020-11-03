import pWhile from 'p-whilst'
import { Analytics } from '../../analytics'
import { groupBy } from '../../lib/group-by'
import { PriorityQueue } from '../../lib/priority-queue'
import { isOnline } from '../connection'
import { Context } from '../context'
import { Emitter } from '../emitter'
import { Integrations } from '../events'
import { Extension } from '../extension'
import { attempt, ensure } from './delivery'

type ExtensionsByType = {
  before: Extension[]
  after: Extension[]
  enrichment: Extension[]
  destinations: Extension[]
}

export class EventQueue extends Emitter {
  queue: PriorityQueue<Context>
  extensions: Extension[] = []
  private flushing = false

  constructor() {
    super()
    this.queue = new PriorityQueue(4, [])
  }

  async register(ctx: Context, extension: Extension, instance: Analytics): Promise<void> {
    await Promise.resolve(extension.load(ctx, instance))
      .then(() => {
        this.extensions.push(extension)
      })
      .catch((err) => {
        if (extension.type === 'destination') {
          ctx.log('warn', 'Failed to load destination', { extension: extension.name, error: err })
          return
        }

        throw err
      })
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

      this.scheduleFlush()
    }, timeout)
  }

  async flush(): Promise<Context[]> {
    const flushed: Context[] = []
    const failed: Context[] = []

    await pWhile(
      () => this.queue.length > 0 && isOnline(),
      async () => {
        const start = new Date().getTime()
        const ctx = this.queue.pop()
        ctx?.updateEvent('context.attempts', this.queue.getAttempts(ctx))

        if (!ctx) {
          return
        }

        try {
          await this.flushOne(ctx)
          const done = new Date().getTime() - start
          ctx.stats.gauge('delivered', done)
          ctx.log('debug', 'Delivered', ctx.event)

          flushed.push(ctx)
          this.emit('flush', ctx, true)
        } catch (err) {
          ctx.log('error', 'Failed to deliver', err)
          ctx.stats.increment('delivery_failed')
          failed.push(ctx)
        }
      }
    )

    // re-queue all failed
    failed.forEach((ctx) => {
      const accepted = this.queue.pushWithBackoff(ctx)
      if (!accepted) {
        this.emit('flush', ctx, false)
      }
    })

    return flushed
  }

  private isReady(): boolean {
    // return this.extensions.every((p) => p.isLoaded())
    // should we wait for every extension to load?
    return true
  }

  private availableExtensios(denyList: Integrations): ExtensionsByType {
    const available = this.extensions.filter((p) => denyList[p.name] !== false)
    const { before = [], enrichment = [], destination = [], after = [] } = groupBy(available, 'type')

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

    const denyList = ctx.event.options?.integrations ?? {}
    const { before, enrichment, destinations, after } = this.availableExtensios(denyList)

    for (const beforeWare of before) {
      const temp: Context | undefined = await ensure(ctx, beforeWare)
      if (temp !== undefined) {
        ctx = temp
      }
    }

    // TODO: should enrichment halt the pipeline?
    // TODO: should enrichment be run in parallel?
    for (const enrichmentWare of enrichment) {
      const temp: Context | Error = await attempt(ctx, enrichmentWare)
      if (temp instanceof Context) {
        ctx = temp
      }
    }

    // TODO: concurrency control
    // TODO: timeouts
    const deliveryAttempts = destinations.map((destination) => attempt(ctx, destination))
    await Promise.all(deliveryAttempts)

    ctx.stats.increment('message_delivered')

    const afterCalls = after.map((after) => attempt(ctx, after))
    await Promise.all(afterCalls)

    return ctx
  }
}
