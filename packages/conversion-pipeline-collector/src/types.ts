/** Native analytics-next event (camelCase) from the browser SDK. */
export type CollectEvent = Record<string, unknown> & {
  type?: string
  event?: string
  anonymousId?: string
  userId?: string
  traits?: Record<string, unknown>
  properties?: Record<string, unknown>
  context?: CollectContext
  messageId?: string
  timestamp?: string
  sentAt?: string
  originalTimestamp?: string
  original_timestamp?: string
  _metadata?: { retryCount?: number }
}

export type CollectContext = Record<string, unknown> & {
  sessionId?: string
  session_id?: string
  campaign?: Record<string, unknown>
  page?: {
    url?: string
    path?: string
    title?: string
    referrer?: string
    search?: string
  }
  app?: { name?: string }
  library?: { name?: string; version?: string }
  traits?: Record<string, unknown>
}

/** Legacy envelope v2 (snake_case) — compat during rollout. */
export type LegacyEventEnvelope = Record<string, unknown> & {
  type?: string
  event_name?: string
  anonymous_id?: string
  user_id?: string
  traits?: Record<string, unknown>
  properties?: Record<string, unknown>
  context?: CollectContext
  message_id?: string
  timestamp?: string
  sent_at?: string
  original_timestamp?: string
  version?: number
}

export type FlatEvent = {
  message_id: string
  anonymous_id: string
  user_id: string | null
  session_id: string
  event_type: string
  timestamp: string | null
  /** Legacy envelope v2 only; null for native SDK traffic. */
  original_timestamp: string | null
  sent_at: string | null
  retry_count: number
  page_url: string | null
  page_path: string | null
  page_title: string | null
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  gclid: string | null
  fbclid: string | null
  ttclid: string | null
  msclkid: string | null
  twclid: string | null
  block_id: string | null
  block_position: number | null
  ad_request_id: string | null
  viewable: boolean | null
  visitor_country: string | null
  country: string | null
  vertical: string | null
  product: string | null
  funnel: string | null
  email_hash: string | null
  phone_hash: string | null
  email_domain: string | null
  quality_flag: string | null
  properties_json: string
  context_json: string
}

export type CollectSuccessResponse = {
  ok: true
  queued: number
}

export type CollectErrorResponse = {
  ok: false
  error: string
  detail?: string
}
