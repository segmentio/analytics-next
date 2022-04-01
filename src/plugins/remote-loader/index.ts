import type { Integrations } from '../../core/events/interfaces'
import { LegacySettings } from '../../browser'
import { JSONValue } from '../../core/events'
import { Plugin } from '../../core/plugin'
import { asPromise } from '../../lib/as-promise'
import { loadScript } from '../../lib/load-script'
import { getCDN } from '../../lib/parse-cdn'

export interface RemotePlugin {
  /** The name of the remote plugin */
  name: string
  /** The url of the javascript file to load */
  url: string
  /** The UMD/global name the plugin uses. Plugins are expected to exist here with the `PluginFactory` method signature */
  libraryName: string
  /** The settings related to this plugin. */
  settings: JSONValue
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
  integrations: Integrations,
  obfuscate?: boolean
): Promise<Plugin[]> {
  const allPlugins: Plugin[] = []
  const cdn = window.analytics?._cdn ?? getCDN()

  const pluginPromises = (settings.remotePlugins ?? []).map(
    async (remotePlugin) => {
      if (
        (integrations.All === false && !integrations[remotePlugin.name]) ||
        integrations[remotePlugin.name] === false
      )
        return
      try {
        if (obfuscate) {
          const urlToArray = remotePlugin.url.split('/')
          // Not every url has the full remotePlugin.name in the url, but we know the shape of the url ends with name/bundle
          const actionName = urlToArray[urlToArray.length - 2]
          const obfuscatedURL = urlToArray
            .map((value, index) => {
              if (actionName === value) {
                return btoa(value).replace(/=/g, '')
              }
              if (index === urlToArray.length - 1) {
                // bundle file
                return `${btoa(actionName).replace(/=/g, '')}.js`
              }
              return value
            })
            .join('/')

          try {
            await loadScript(
              obfuscatedURL.replace('https://cdn.segment.com', cdn)
            )
          } catch (error) {
            // Due to syncing concerns it is possible that the obfuscated action destination might not exist at a given point.
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
          const plugin = await asPromise(pluginFactory(remotePlugin.settings))
          const plugins = Array.isArray(plugin) ? plugin : [plugin]

          validate(plugins)

          allPlugins.push(...plugins)
        }
      } catch (error) {
        console.warn('Failed to load Remote Plugin', error)
      }
    }
  )

  await Promise.all(pluginPromises)
  return allPlugins.filter(Boolean)
}
