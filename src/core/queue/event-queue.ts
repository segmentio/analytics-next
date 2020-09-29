import pWhile from 'p-whilst'
import { Analytics } from '../..'
import { isOnline } from '../connection'
import { Context } from '../context'
import { Emitter } from '../emitter'
import { Extension } from '../extension'
import { attempt, ensure } from './delivery'

export class EventQueue extends Emitter {
  queue: Context[]
  extensions: Extension[] = []
  private flushing = false

  constructor() {
    super()
    this.queue = []
  }

  async register(ctx: Context, extension: Extension, instance: Analytics): Promise<void> {
    await extension
      .load(ctx, instance)
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

    return new Promise((resolve, _reject) => {
      const onDeliver = (flushed: Context): void => {
        if (flushed.isSame(ctx)) {
          this.off('flush', onDeliver)
          resolve(flushed)
        }
      }
      this.on('flush', onDeliver)
    })
  }

  private scheduleFlush(timeout = 500): void {
    if (this.flushing) {
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      this.flushing = true

      await this.flush()
      this.flushing = false

      this.scheduleFlush()
    }, timeout)
  }

  async flush(): Promise<Context[]> {
    const flushed: Context[] = []

    await pWhile(
      () => this.queue.length > 0 && isOnline(),
      async () => {
        const start = new Date().getTime()
        const ctx = this.queue.shift()
        if (!ctx) {
          return
        }

        try {
          await this.flushOne(ctx)
          const done = new Date().getTime() - start
          ctx.stats.gauge('delivered', done)
          ctx.log('debug', 'Delivered', ctx.event)

          flushed.push(ctx)
          this.emit('flush', ctx)
        } catch (err) {
          ctx.log('error', 'Failed to deliver')
          ctx.stats.increment('delivery_failed')

          // Retrying...
          // How many times until discard?
          this.queue.push(ctx)

          // TODO: sleep?
        }
      }
    )

    return flushed
  }

  private isReady(): boolean {
    // return this.extensions.every((p) => p.isLoaded())
    // should we wait for every extension to load?
    return true
  }

  private async flushOne(ctx: Context): Promise<Context | undefined> {
    if (!this.isReady()) {
      throw new Error('Not ready')
    }

    const denyList = ctx.event.options?.integrations ?? {}
    const availableExtensions = this.extensions.filter((p) => denyList[p.name] !== false)

    const before = availableExtensions.filter((p) => p.type === 'before')
    const enrichment = availableExtensions.filter((p) => p.type === 'enrichment')
    const destinations = availableExtensions.filter((p) => p.type === 'destination' && denyList[p.name] !== false)

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

    // No more changes to ctx from now on
    ctx.seal()

    // TODO: concurrency control
    // TODO: timeouts
    const deliveryAttempts = destinations.map((destination) => attempt(ctx, destination))
    await Promise.all(deliveryAttempts)

    ctx.stats.increment('message_delivered')
    return ctx
  }
}
