import type { ConversionCollectorSettings } from '../plugins/conversion-collector/types'
import type { AnalyticsInitConfig } from './types'

export const DEFAULT_INIT_CONFIG: Required<
  Pick<
    AnalyticsInitConfig,
    | 'endpoint'
    | 'flushIntervalMs'
    | 'batchSize'
    | 'retryAttempts'
    | 'debug'
    | 'respectDoNotTrack'
  >
> = {
  endpoint: '/collector',
  flushIntervalMs: 3000,
  batchSize: 10,
  retryAttempts: 2,
  debug: false,
  respectDoNotTrack: false,
}

export function toCollectorSettings(
  config: AnalyticsInitConfig
): ConversionCollectorSettings {
  return {
    endpoint: config.endpoint ?? DEFAULT_INIT_CONFIG.endpoint,
    headers: config.headers,
    retryAttempts: config.retryAttempts ?? DEFAULT_INIT_CONFIG.retryAttempts,
    flushIntervalMs:
      config.flushIntervalMs ?? DEFAULT_INIT_CONFIG.flushIntervalMs,
    batchSize: config.batchSize ?? DEFAULT_INIT_CONFIG.batchSize,
    appName: config.appName,
    getContext: config.getContext,
    getSessionId: config.getSessionId,
    getVisitorCountry: config.getVisitorCountry,
    defaultPhoneCountryCode: config.defaultPhoneCountryCode,
    isTrackingAllowed: config.isTrackingAllowed,
    respectDoNotTrack:
      config.respectDoNotTrack ?? DEFAULT_INIT_CONFIG.respectDoNotTrack,
    enableGptSlotEvents: config.enableGptSlotEvents === true,
    enableConsentEnrichment: config.enableConsentEnrichment === true,
    enableContextEnrichment: config.enableContextEnrichment === true,
    enableIdentifyHashing: config.enableIdentifyHashing === true,
    enablePageTaxonomy: config.enablePageTaxonomy === true,
  }
}
