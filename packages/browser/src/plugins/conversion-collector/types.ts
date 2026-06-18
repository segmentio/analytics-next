/** Native analytics-next / Segment collect event (camelCase). */
export type CollectEvent = Record<string, unknown> & {
  type?: string
  messageId?: string
  anonymousId?: string
  sentAt?: string
  _metadata?: { retryCount?: number }
  _retryCount?: number
}

export interface ConversionCollectorSettings {
  endpoint: string
  headers?: Record<string, string>
  retryAttempts?: number
  flushIntervalMs?: number
  batchSize?: number
  appName?: string
  getContext?: () => Record<string, unknown>
  getSessionId?: () => string
  getVisitorCountry?: () => string | Promise<string>
  defaultPhoneCountryCode?: string
  isTrackingAllowed?: () => boolean
  respectDoNotTrack?: boolean
  enableGptSlotEvents?: boolean
  /** Optional legacy enrichments — off by default (MVP pipeline). */
  enableConsentEnrichment?: boolean
  enableContextEnrichment?: boolean
  enableIdentifyHashing?: boolean
  enablePageTaxonomy?: boolean
}

/** @deprecated Use native CollectEvent array POST body instead. */
export interface AnalyticsEventEnvelope {
  type: 'track' | 'identify'
  event_name?: string
  anonymous_id: string
  user_id?: string
  traits?: Record<string, unknown>
  properties?: Record<string, unknown>
  context: Record<string, unknown>
  integrations?: Record<string, boolean>
  message_id: string
  original_timestamp: string
  sent_at?: string
  timestamp: string
  version: 2
}
