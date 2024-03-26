import { Context, ContextCancelation, Plugin } from '../../../index'

export interface BasePluginOptions {
  shouldThrow?: boolean
  shouldCancel?: boolean
}

class BasePlugin implements Partial<Plugin> {
  public version = '1.0.0'
  private shouldCancel: boolean
  private shouldThrow: boolean

  constructor({
    shouldCancel = false,
    shouldThrow = false,
  }: BasePluginOptions) {
    this.shouldCancel = shouldCancel
    this.shouldThrow = shouldThrow
  }

  isLoaded() {
    return true
  }

  load() {
    return Promise.resolve()
  }

  alias(ctx: Context): Context {
    return this.task(ctx)
  }

  group(ctx: Context): Context {
    return this.task(ctx)
  }

  identify(ctx: Context): Context {
    return this.task(ctx)
  }

  page(ctx: Context): Context {
    return this.task(ctx)
  }

  screen(ctx: Context): Context {
    return this.task(ctx)
  }

  track(ctx: Context): Context {
    return this.task(ctx)
  }

  private task(ctx: Context): Context {
    if (this.shouldCancel) {
      ctx.cancel(
        new ContextCancelation({
          retry: false,
        })
      )
    } else if (this.shouldThrow) {
      throw new Error(`Error thrown in task`)
    }
    return ctx
  }
}

export class TestBeforePlugin extends BasePlugin {
  public name = 'Test Before Error'
  public type = 'before' as const
}

export class TestEnrichmentPlugin extends BasePlugin {
  public name = 'Test Enrichment Error'
  public type = 'enrichment' as const
}

export class TestDestinationPlugin extends BasePlugin {
  public name = 'Test Destination Error'
  public type = 'destination' as const

  public ready() {
    return Promise.resolve(true)
  }
}

export class TestAfterPlugin extends BasePlugin {
  public name = 'Test After Error'
  public type = 'after' as const
}
