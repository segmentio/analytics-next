export type ConversionEventType = 'track' | 'identify'

export interface AnalyticsEventEnvelope {
  type: ConversionEventType
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

export interface CollectRequestBody {
  events: AnalyticsEventEnvelope[]
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
}
