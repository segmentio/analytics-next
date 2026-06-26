import type { AnalyticsInitConfig } from './types'
import { DEFAULT_INIT_CONFIG } from './config'

/** Hardcoded config per writeKey (MVP). Phase 2: remote Configuration Server. */
const WRITE_KEY_REGISTRY: Record<string, AnalyticsInitConfig> = {
  'conversion-pipeline': {
    writeKey: 'conversion-pipeline',
    endpoint: '/collector',
    appName: 'conversion-pipeline',
    enableGptSlotEvents: false,
  },
}

export function isWriteKey(value: string): boolean {
  return value.length > 0 && !value.startsWith('{')
}

export function resolveInitConfig(
  writeKeyOrConfig: string | AnalyticsInitConfig,
  options?: Partial<AnalyticsInitConfig>
): AnalyticsInitConfig {
  if (typeof writeKeyOrConfig === 'string') {
    const base = WRITE_KEY_REGISTRY[writeKeyOrConfig] ?? {
      writeKey: writeKeyOrConfig,
      endpoint: DEFAULT_INIT_CONFIG.endpoint,
      appName: writeKeyOrConfig,
      enableGptSlotEvents: false,
    }
    return {
      ...DEFAULT_INIT_CONFIG,
      ...base,
      ...options,
      writeKey: writeKeyOrConfig,
    }
  }

  return {
    ...DEFAULT_INIT_CONFIG,
    ...writeKeyOrConfig,
    ...options,
    writeKey: writeKeyOrConfig.writeKey ?? 'conversion-pipeline',
  }
}
