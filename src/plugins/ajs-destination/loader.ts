import { Analytics } from '../../analytics'
import { LegacyIntegrationConfiguration } from '../../browser'
import { Context } from '../../core/context'
import { User } from '../../core/user'
import { loadScript } from '../../lib/load-script'
import { LegacyIntegration } from './types'

const path =
  process.env.LEGACY_INTEGRATIONS_PATH ??
  'https://cdn.segment.build/next-integrations'

function normalizeName(name: string): string {
  return name.toLowerCase().replace('.', '').replace(/\s+/g, '-')
}

function recordLoadMetrics(fullPath: string, ctx: Context, name: string): void {
  try {
    const [metric] =
      global.window?.performance?.getEntriesByName(fullPath, 'resource') ?? []
    // we assume everything that took under 100ms is cached
    metric &&
      ctx.stats.gauge('legacy_destination_time', Math.round(metric.duration), [
        name,
        ...(metric.duration < 100 ? ['cached'] : []),
      ])
  } catch (_) {
    // not available
  }
}

export async function loadIntegration(
  ctx: Context,
  analyticsInstance: Analytics,
  name: string,
  version: string,
  settings?: object
): Promise<LegacyIntegration> {
  const pathName = normalizeName(name)
  const fullPath = `${path}/${pathName}/${version}/${pathName}.dynamic.js.gz`

  try {
    await loadScript(fullPath)
    recordLoadMetrics(fullPath, ctx, name)
  } catch (err) {
    ctx.stats.gauge('legacy_destination_time', -1, [`plugin:${name}`, `failed`])
    throw err
  }

  // @ts-ignore
  const deps: string[] = window[`${pathName}Deps`]
  await Promise.all(deps.map((dep) => loadScript(path + dep + '.gz')))

  // @ts-ignore
  window[`${pathName}Loader`]()

  // @ts-ignore
  let integrationBuilder = window[`${pathName}Integration`]

  // GA and Appcues use a different interface to instantiating integrations
  if (integrationBuilder.Integration) {
    const analyticsStub = {
      user: (): User => analyticsInstance.user(),
      addIntegration: (): void => {},
    }

    integrationBuilder(analyticsStub)
    integrationBuilder = integrationBuilder.Integration
  }

  const integration = new integrationBuilder(settings)
  integration.analytics = analyticsInstance

  return integration
}

/**
 * resolveVersion should be a temporary function. As not all sources have been
 * rebuilt and we're constantly changing the CDN settings file, we cannot
 * guarantee which `version` field (`version` or `versionSettings`) will be
 * available.
 */
export function resolveVersion(
  settings: LegacyIntegrationConfiguration
): string {
  let version = 'latest'
  if (settings.version) version = settings.version

  if (settings.versionSettings) {
    version =
      settings.versionSettings.override ??
      settings.versionSettings.version ??
      'latest'
  }

  return version
}
