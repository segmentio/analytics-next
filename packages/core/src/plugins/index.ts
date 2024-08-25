import type { CoreAnalytics } from '../analytics'
import type { CoreContext } from '../context'

export type PluginType =
  | 'before'
  | 'after'
  | 'destination'
  | 'enrichment'
  | 'utility'

export interface PluginRegistration<
  Ctx extends CoreContext = CoreContext,
  Analytics extends CoreAnalytics = any
> {
  name?: string
  version?: string
  type: PluginType
  /**
   * Load the plugin. This is where you should load any external dependencies.
   * No events will be sent to the plugin until this method resolves.
   * If this is an enrichment or before plugin, the entire pipeline will halt until this resolves.
   */
  load: (ctx: Ctx, instance: Analytics) => Promise<unknown>
  /**
   *  By default, isLoaded is true once load has resolved.
   *  This overrides the default behavior.
   */
  isLoaded?: () => boolean
  unload?: (ctx: Ctx, instance: Analytics) => Promise<unknown> | unknown
  track?: (ctx: Ctx) => Promise<Ctx> | Ctx
  identify?: (ctx: Ctx) => Promise<Ctx> | Ctx
  page?: (ctx: Ctx) => Promise<Ctx> | Ctx
  group?: (ctx: Ctx) => Promise<Ctx> | Ctx
  alias?: (ctx: Ctx) => Promise<Ctx> | Ctx
  screen?: (ctx: Ctx) => Promise<Ctx> | Ctx
}

export const createCorePlugin = <Ctx extends CoreContext>(
  plugin: PluginRegistration<Ctx>
): CorePlugin<Ctx> => {
  let loaded = false
  return {
    ...plugin,
    load: (...args) =>
      plugin
        .load(...args)
        .then((val) => {
          loaded = true
          return val
        })
        .catch((e) => {
          loaded = false
          throw e
        }),
    name: plugin.name || `unknown_${Math.floor(Math.random() * 100000)}`,
    version: plugin.version || '0.0.0',
    isLoaded: plugin.isLoaded ?? (() => loaded),
  }
}

export interface CorePlugin<
  Ctx extends CoreContext = CoreContext,
  Analytics extends CoreAnalytics = any
> extends PluginRegistration<Ctx, Analytics> {
  name: string
  alternativeNames?: string[]
  version: string
  type: PluginType
  /**
   * By default, plugins are loaded once the .load method has resolved. If true, the load method has returned.
   * If false, either the load method has not resolved successfully or has rejected.
   * @returns true if the plugin has loaded successfully, and false if the plugin is
   */
  isLoaded: () => boolean
  load: (ctx: Ctx, instance: Analytics) => Promise<unknown>

  unload?: (ctx: Ctx, instance: Analytics) => Promise<unknown> | unknown
  ready?: () => Promise<unknown>
  track?: (ctx: Ctx) => Promise<Ctx> | Ctx
  identify?: (ctx: Ctx) => Promise<Ctx> | Ctx
  page?: (ctx: Ctx) => Promise<Ctx> | Ctx
  group?: (ctx: Ctx) => Promise<Ctx> | Ctx
  alias?: (ctx: Ctx) => Promise<Ctx> | Ctx
  screen?: (ctx: Ctx) => Promise<Ctx> | Ctx
}
