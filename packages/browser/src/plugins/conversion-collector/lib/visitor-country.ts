import type { ConversionCollectorSettings } from '../types'

export function visitorCountryFromNavigator(): string {
  if (typeof navigator === 'undefined') {
    return ''
  }

  const language = navigator.language?.trim() ?? ''
  if (!language) {
    return ''
  }

  const parts = language.split('-')
  if (parts.length >= 2) {
    const region = parts[parts.length - 1]?.trim().toUpperCase() ?? ''
    if (/^[A-Z]{2}$/.test(region)) {
      return region
    }
  }

  return ''
}

export async function resolveVisitorCountry(
  config: ConversionCollectorSettings
): Promise<string> {
  if (config.getVisitorCountry) {
    try {
      const resolved = await config.getVisitorCountry()
      const trimmed = resolved?.trim()
      if (trimmed) {
        return trimmed
      }
    } catch {
      // fall through to navigator
    }
  }

  return visitorCountryFromNavigator()
}
