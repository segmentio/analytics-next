import { Context } from './context'
import { Extension } from './extension'
import pWhile from 'p-whilst'

interface EventQueueConfig {
  extensions: Extension[]
}

async function attempt(ctx: Context, extension: Extension): Promise<Context | undefined> {
  ctx.log('debug', 'extension', { extension: extension.name })
  const start = new Date().getTime()

  const newCtx = await extension[ctx.event.type](ctx)
    .then((ctx) => {
      const done = new Date().getTime() - start
      ctx.stats.gauge('extension_time', done)
      return ctx
    })
    .catch((err) => {
      ctx.log('error', 'extension Error', { extension: extension.name, error: err })
      ctx.stats.increment('extension_error', 1, [`${extension}:${extension.name}`])
      return undefined
    })

  return newCtx
}

async function ensure(ctx: Context, extension: Extension): Promise<Context | undefined> {
  const newContext = await attempt(ctx, extension)

  if (newContext === undefined) {
    ctx.log('debug', 'Context canceled')
    ctx.cancel()
  }

  return newContext
}

export class EventQueue {
  queue: Context[]
  config: EventQueueConfig

  constructor(config: EventQueueConfig) {
    this.queue = []
    this.config = config

    // TODO: load extensions
  }

  async dispatch(ctx: Context): Promise<Context> {
    ctx.log('debug', 'Dispatching')
    this.queue.push(ctx)
    return Promise.resolve(ctx)
  }

  async flush(): Promise<void> {
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
    const allReady = this.config.extensions.every((p) => p.isLoaded && !p.critical)
    return allReady
  }

  private async flushOne(ctx: Context): Promise<void> {
    // TODO: check connection
    if (!this.isReady()) {
      return
    }

    const utilities = this.config.extensions.filter((p) => p.type === 'utility')
    const before = this.config.extensions.filter((p) => p.type === 'before')
    const enrichment = this.config.extensions.filter((p) => p.type === 'enrichment')
    const destinations = this.config.extensions.filter((p) => p.type === 'destination')

    // TODO: run utilities at different stage
    // these are not event dependent
    for (const utility of utilities) {
      const temp: Context | undefined = await attempt(ctx, utility)
      if (temp !== undefined) {
        ctx = temp
      }
    }

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
  }
}
