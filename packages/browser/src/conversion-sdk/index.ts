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
  AnalyticsEventEnvelope,
  AnalyticsInitConfig,
  CollectRequestBody,
  DebugInfo,
  IdentifyLegacyInput,
  IdentifyOptions,
  TrackLegacyInput,
  TrackOptions,
} from './types'

export function attachToWindow(globalName = 'ConversionAnalytics'): void {
  if (typeof window === 'undefined') {
    return
  }

  const sdk = {
    init,
    start,
    stop,
    track,
    identify,
    page,
    flush,
    getQueueSize,
    getDebugInfo,
  }

  ;(window as unknown as Record<string, unknown>)[globalName] = sdk
}
