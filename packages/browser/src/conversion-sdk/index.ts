import {
  flush,
  getDebugInfo,
  getQueueSize,
  identify,
  init,
  page,
  start,
  stop,
  track,
} from './singleton'

export {
  flush,
  getDebugInfo,
  getQueueSize,
  identify,
  init,
  page,
  start,
  stop,
  track,
} from './singleton'
export { bootstrapConversionAnalyticsFromWindow } from './bootstrap'
export { ConversionAnalyticsBrowser } from './conversion-analytics-browser'
export { ConversionClient } from './conversion-client'
export type {
  CollectEvent,
  AnalyticsInitConfig,
  CollectRequestBody,
  DebugInfo,
  IdentifyLegacyInput,
  IdentifyOptions,
  TrackLegacyInput,
  TrackOptions,
} from './types'

export { resolveInitConfig } from './write-key-config'

export function attachToWindow(globalName = 'analytics'): void {
  if (typeof window === 'undefined') {
    return
  }

  const sdk = {
    init,
    track,
    identify,
    page,
  }

  ;(window as unknown as Record<string, unknown>)[globalName] = sdk
}
