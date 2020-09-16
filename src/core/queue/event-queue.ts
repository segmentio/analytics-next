import { Context } from '../context'
import { Extension } from '../extension'
import pWhile from 'p-whilst'
import { attempt, ensure } from './delivery'

interface EventQueueConfig {
  inline?: boolean
  extensions: Extension[]
}

export class EventQueue {
  queue: Context[]
  archive: Context[]

  config: EventQueueConfig

  constructor(config: EventQueueConfig) {
    this.queue = []
    this.archive = []
    this.config = config

    this.init().catch((err) => {
      console.error('Error initializing extensions', err)
    })
  }

  private async init(): Promise<void> {
    const ctx = Context.system()
    const extensions = this.config.extensions

    const loaders = extensions.map((xt) => xt.load(ctx, {}))
    await Promise.all(loaders)
  }

  async register(extension: Extension): Promise<void> {
    this.config.extensions.push(extension)
    const ctx = Context.system()
    await extension.load(ctx, {})
  }

  async dispatch(ctx: Context): Promise<Context | undefined> {
    ctx.log('debug', 'Dispatching')
    ctx.stats.increment('message_dispatched')

    if (this.config.inline) {
      return this.flushOne(ctx)
    } else {
      this.queue.push(ctx)
    }

    return Promise.resolve(ctx)
  }

  async flush(): Promise<void> {
    // prevent multiple calls to `flush()`
    await pWhile(
      () => this.queue.length > 0,
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
          ctx.log('debug', 'Delivered')
          this.archive.push(ctx)
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
  }

  private isReady(): boolean {
    return this.config.extensions.every((p) => p.isLoaded())
  }

  private async flushOne(ctx: Context): Promise<Context | undefined> {
    // TODO: check connection
    if (!this.isReady()) {
      return
    }

    const before = this.config.extensions.filter((p) => p.type === 'before')
    const enrichment = this.config.extensions.filter((p) => p.type === 'enrichment')
    const destinations = this.config.extensions.filter((p) => p.type === 'destination')

    for (const beforeWare of before) {
      const temp: Context | undefined = await ensure(ctx, beforeWare)
      if (temp !== undefined) {
        ctx = temp
      }
    }

    // TODO: should enrichment halt the pipeline?
    // TODO: should enrichment be run in parallel?
    for (const enrichmentWare of enrichment) {
      const temp: Context | undefined = await attempt(ctx, enrichmentWare)
      if (temp !== undefined) {
        ctx = temp
      }
    }

    // No more changes to ctx from now on
    ctx.seal()

    // TODO: send to Segment

    // TODO: concurrency control
    // TODO: timeouts
    const deliveryAttempts = destinations.map((destination) => attempt(ctx, destination))
    await Promise.all(deliveryAttempts)

    ctx.stats.increment('message_delivered')
    return ctx
  }
}
