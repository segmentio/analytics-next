import type { Integrations } from '../../core/events/interfaces'
import { LegacySettings } from '../../browser'
import { JSONObject, JSONValue } from '../../core/events'
import { Plugin } from '../../core/plugin'
import { asPromise } from '../../lib/as-promise'
import { loadScript } from '../../lib/load-script'
import { getCDN } from '../../lib/parse-cdn'
import {
  applyDestinationMiddleware,
  DestinationMiddlewareFunction,
} from '../middleware'
import { Context, ContextCancelation } from '../../core/context'
import { Analytics } from '../../core/analytics'

export interface RemotePlugin {
  /** The name of the remote plugin */
  name: string
  /** The creation name of the remote plugin */
  creationName: string
  /** The url of the javascript file to load */
  url: string
  /** The UMD/global name the plugin uses. Plugins are expected to exist here with the `PluginFactory` method signature */
  libraryName: string
  /** The settings related to this plugin. */
  settings: JSONObject
}

export class ActionDestination implements Plugin {
  name: string // destination name
  version = '1.0.0'
  type: Plugin['type']

  alternativeNames: string[] = []

  middleware: DestinationMiddlewareFunction[] = []

  action: Plugin

  constructor(name: string, action: Plugin) {
    this.action = action
    this.name = name
    this.type = action.type
    this.alternativeNames.push(action.name)
  }

  addMiddleware(...fn: DestinationMiddlewareFunction[]): void {
    this.middleware.push(...fn)
  }

  private async transform(ctx: Context): Promise<Context> {
    const modifiedEvent = await applyDestinationMiddleware(
      this.name,
      ctx.event,
      this.middleware
    )

    if (modifiedEvent === null) {
      ctx.cancel(
        new ContextCancelation({
          retry: false,
          reason: 'dropped by destination middleware',
        })
      )
    }

    return new Context(modifiedEvent!)
  }

  private _createMethod(
    methodName: 'track' | 'page' | 'identify' | 'alias' | 'group' | 'screen'
  ) {
    return async (ctx: Context): Promise<Context> => {
      if (!this.action[methodName]) return ctx

      const transformedContext = await this.transform(ctx)
      await this.action[methodName]!(transformedContext)

      return ctx
    }
  }

  alias = this._createMethod('alias')
  group = this._createMethod('group')
  identify = this._createMethod('identify')
  page = this._createMethod('page')
  screen = this._createMethod('screen')
  track = this._createMethod('track')

  /* --- PASSTHROUGH METHODS --- */
  isLoaded(): boolean {
    return this.action.isLoaded()
  }

  ready(): Promise<unknown> {
    return this.action.ready ? this.action.ready() : Promise.resolve()
  }

  load(ctx: Context, analytics: Analytics): Promise<unknown> {
    return this.action.load(ctx, analytics)
  }

  unload(ctx: Context, analytics: Analytics): Promise<unknown> | unknown {
    return this.action.unload?.(ctx, analytics)
  }
}

type PluginFactory = (
  settings: JSONValue
) => Plugin | Plugin[] | Promise<Plugin | Plugin[]>

function validate(pluginLike: unknown): pluginLike is Plugin[] {
  if (!Array.isArray(pluginLike)) {
    throw new Error('Not a valid list of plugins')
  }

  const required = ['load', 'isLoaded', 'name', 'version', 'type']
  pluginLike.forEach((plugin) => {
    required.forEach((method) => {
      if (plugin[method] === undefined) {
        throw new Error(
          `Plugin: ${
            plugin.name ?? 'unknown'
          } missing required function ${method}`
        )
      }
    })
  })

  return true
}

export async function remoteLoader(
  settings: LegacySettings,
  userIntegrations: Integrations,
  mergedIntegrations: Record<string, JSONObject>,
  obfuscate?: boolean,
  routingMiddleware?: DestinationMiddlewareFunction
): Promise<Plugin[]> {
  const allPlugins: Plugin[] = []
  const cdn = getCDN()

  const routingRules = settings.middlewareSettings?.routingRules ?? []

  const pluginPromises = (settings.remotePlugins ?? []).map(
    async (remotePlugin) => {
      if (
        (userIntegrations.All === false &&
          !userIntegrations[remotePlugin.name]) ||
        userIntegrations[remotePlugin.name] === false
      )
        return
      try {
        if (obfuscate) {
          const urlSplit = remotePlugin.url.split('/')
          const name = urlSplit[urlSplit.length - 2]
          const obfuscatedURL = remotePlugin.url.replace(
            name,
            btoa(name).replace(/=/g, '')
          )
          try {
            await loadScript(
              obfuscatedURL.replace('https://cdn.segment.com', cdn)
            )
          } catch (error) {
            // Due to syncing concerns it is possible that the obfuscated action destination (or requested version) might not exist.
            // We should use the unobfuscated version as a fallback.
            await loadScript(
              remotePlugin.url.replace('https://cdn.segment.com', cdn)
            )
          }
        } else {
          await loadScript(
            remotePlugin.url.replace('https://cdn.segment.com', cdn)
          )
        }

        const libraryName = remotePlugin.libraryName

        // @ts-expect-error
        if (typeof window[libraryName] === 'function') {
          // @ts-expect-error
          const pluginFactory = window[libraryName] as PluginFactory
          const plugin = await asPromise(
            pluginFactory({
              ...remotePlugin.settings,
              ...mergedIntegrations[remotePlugin.name],
            })
          )
          const plugins = Array.isArray(plugin) ? plugin : [plugin]

          validate(plugins)

          const routing = routingRules.filter(
            (rule) => rule.destinationName === remotePlugin.creationName
          )

          plugins.forEach((plugin) => {
            const wrapper = new ActionDestination(
              remotePlugin.creationName,
              plugin
            )

            /** Make sure we only apply destination filters to actions of the "destination" type to avoid causing issues for hybrid destinations */
            if (
              routing.length &&
              routingMiddleware &&
              plugin.type === 'destination'
            ) {
              wrapper.addMiddleware(routingMiddleware)
            }

            allPlugins.push(wrapper)
          })
        }
      } catch (error) {
        console.warn('Failed to load Remote Plugin', error)
      }
    }
  )

  await Promise.all(pluginPromises)
  return allPlugins.filter(Boolean)
}
