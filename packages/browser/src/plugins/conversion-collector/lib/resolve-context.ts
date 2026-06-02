import { version } from '../../../generated/version'
import type { ConversionCollectorSettings } from '../types'

const SDK_LIBRARY = {
  name: 'conversion-analytics-sdk',
  version,
}

export function resolveContext(
  config: ConversionCollectorSettings,
  extraContext?: Record<string, unknown>
): Record<string, unknown> {
  const runtimeContext: Record<string, unknown> = {}

  if (typeof window !== 'undefined') {
    const referrer = document.referrer || undefined
    const location = window.location
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const navigatorWithHints = navigator as Navigator & {
      userAgentData?: {
        brands?: unknown
        mobile?: boolean
        platform?: string
      }
    }

    runtimeContext.page = {
      path: location.pathname,
      referrer,
      search: location.search,
      title: document.title || undefined,
      url: location.href,
    }
    runtimeContext.library = SDK_LIBRARY
    runtimeContext.channel = 'browser'
    runtimeContext.locale = navigator.language
    runtimeContext.screen = {
      width: window.screen.width,
      height: window.screen.height,
    }
    runtimeContext.userAgent = navigator.userAgent
    runtimeContext.timezone = timezone || undefined

    if (config.appName) {
      runtimeContext.app = {
        name: config.appName,
      }
    }

    if (navigatorWithHints.userAgentData) {
      runtimeContext.userAgentData = {
        brands: navigatorWithHints.userAgentData.brands,
        mobile: navigatorWithHints.userAgentData.mobile,
        platform: navigatorWithHints.userAgentData.platform,
      }
    }
  }

  const dynamic = config.getContext?.() ?? {}

  return {
    app_name: config.appName,
    ...runtimeContext,
    ...dynamic,
    ...extraContext,
  }
}
