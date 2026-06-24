import type {
  CollectEvent,
  ConversionCollectorSettings,
} from '../plugins/conversion-collector/types'

export type { CollectEvent, ConversionCollectorSettings }

/** POST body: native analytics-next event array. */
export type CollectRequestBody = CollectEvent[]

export type AnalyticsMethod = 'track' | 'page' | 'identify'

export interface TrackOptions {
  context?: Record<string, unknown>
  timestamp?: string
  integrations?: Record<string, boolean>
}

export interface IdentifyOptions {
  context?: Record<string, unknown>
  timestamp?: string
  integrations?: Record<string, boolean>
}

export interface AnalyticsInitConfig {
  writeKey?: string
  endpoint?: string
  appName?: string
  globalName?: string
  debug?: boolean
  flushIntervalMs?: number
  batchSize?: number
  retryAttempts?: number
  headers?: Record<string, string>
  getContext?: () => Record<string, unknown>
  getSessionId?: () => string
  getVisitorCountry?: () => string | Promise<string>
  isTrackingAllowed?: () => boolean
  respectDoNotTrack?: boolean
  onError?: (error: unknown) => void
  defaultPhoneCountryCode?: string
  enableGptSlotEvents?: boolean
  enableConsentEnrichment?: boolean
  enableContextEnrichment?: boolean
  enableIdentifyHashing?: boolean
  enablePageTaxonomy?: boolean
  lotameClientId?: string
  lotameConfig?: {
    ttlDays?: number
    cookieName?: string
    traitsNamespace?: string
    captureTimeoutMs?: number
  }
}

export interface DebugInfo {
  sessionId?: string
  endpoint: string
  queueSize: number
  lastError?: string
}

export type TrackLegacyInput =
  | string
  | {
      eventName: string
      eventData?: Record<string, unknown>
    }

export type IdentifyLegacyInput =
  | string
  | Record<string, unknown>
  | {
      userId?: string
      traits?: Record<string, unknown>
    }
