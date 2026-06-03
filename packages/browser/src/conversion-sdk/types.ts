import type {
  AnalyticsEventEnvelope,
  ConversionCollectorSettings,
} from '../plugins/conversion-collector/types'

export type { AnalyticsEventEnvelope, ConversionCollectorSettings }

/** POST body for the collector. */
export interface CollectRequestBody {
  events: AnalyticsEventEnvelope[]
}

export type AnalyticsMethod = AnalyticsEventEnvelope['type']

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
  endpoint?: string
  appName?: string
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
