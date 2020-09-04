import { Context } from '../context'

interface ExtensionConfig {
  name: string
  version: string
  options: object
  type: 'before' | 'destination' | 'enrichment' | 'loader' | 'utility'
  priority: 'critical' | 'secondary' // whether AJS should expect this extension to be loaded before starting event delivery
}

// enrichment - modifies the event. Enrichment can happen in parallel, by reducing all changes in the final event. Failures in this stage could halt event delivery.

// destination - runs in parallel at the end of the lifecycle. Cannot modify the event, can fail and not halt execution.

// loader - can load other extensions

// utility - do not affect lifecycle. Should be run and executed once. Their `track/identify` calls don't really do anything. example

export abstract class Extension {
  config: ExtensionConfig

  constructor(config: ExtensionConfig) {
    this.config = config
  }

  type = this.config.type
  name = this.config.name
  priority = this.config.priority

  critical = this.config.priority === 'critical'

  abstract load: (ctx: Context, extensionConfig: ExtensionConfig) => Promise<unknown>
  abstract isLoaded: (ctx: Context) => boolean

  abstract track: (ctx: Context) => Promise<Context>
  abstract identify: (ctx: Context) => Promise<Context>
  abstract page: (ctx: Context) => Promise<Context>
  abstract group: (ctx: Context) => Promise<Context>
  abstract alias: (ctx: Context) => Promise<Context>
}
