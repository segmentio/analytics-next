import { hashPiiField } from './hash-pii'
import type { CollectEvent, FlatEvent } from './types'
import {
  asBoolean,
  asNumber,
  asRecord,
  asString,
  isValidUuidV4,
} from './validation'

export class NormalizeError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'NormalizeError'
    this.code = code
  }
}

function readIdentity(event: CollectEvent): {
  messageId: string
  anonymousId: string
  userId: string | null
} {
  const messageId =
    asString(event.messageId) ??
    asString((event as { message_id?: string }).message_id)
  const anonymousId =
    asString(event.anonymousId) ??
    asString((event as { anonymous_id?: string }).anonymous_id)
  const userId =
    asString(event.userId) ?? asString((event as { user_id?: string }).user_id)

  if (!messageId || !anonymousId) {
    throw new NormalizeError(
      'missing_identity',
      'Event requires messageId and anonymousId'
    )
  }

  return { messageId, anonymousId, userId }
}

function readSessionId(event: CollectEvent): string {
  const ctx = event.context ?? {}
  const sessionId = asString(ctx.sessionId) ?? asString(ctx.session_id)
  if (!sessionId || !isValidUuidV4(sessionId)) {
    throw new NormalizeError(
      'invalid_session_id',
      'context.sessionId must be a UUID v4'
    )
  }
  return sessionId
}

function resolveEventType(event: CollectEvent): string {
  if (event.type === 'identify') {
    return 'identify'
  }
  if (event.type === 'page') {
    return 'page'
  }
  if (event.type === 'screen') {
    return 'screen'
  }
  return asString(event.event) ?? asString((event as { event_name?: string }).event_name) ?? 'unknown'
}

function pickAttribution(
  campaign: Record<string, unknown>,
  props: Record<string, unknown>
): {
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
} {
  const queryParams = asRecord(props.query_params)

  const fromCampaign = (key: string, alt?: string): string | null =>
    asString(campaign[key]) ?? (alt ? asString(campaign[alt]) : null)

  const fromProps = (key: string, alt?: string): string | null =>
    asString(props[key]) ?? (alt ? asString(props[alt]) : null) ?? asString(queryParams[key])

  return {
    utm_source:
      fromCampaign('source') ??
      fromProps('utm_source'),
    utm_medium:
      fromCampaign('medium') ?? fromProps('utm_medium'),
    utm_campaign:
      fromCampaign('name') ??
      fromCampaign('campaign') ??
      fromProps('utm_campaign'),
    utm_content:
      fromCampaign('content') ?? fromProps('utm_content'),
    utm_term:
      fromCampaign('term') ?? fromProps('utm_term'),
    gclid: fromCampaign('gclid') ?? fromProps('gclid'),
    fbclid: fromCampaign('fbclid') ?? fromProps('fbclid'),
    ttclid:
      fromCampaign('ttclid') ??
      fromCampaign('tt_clid') ??
      fromProps('ttclid', 'tt_clid'),
    msclkid: fromCampaign('msclkid') ?? fromProps('msclkid'),
    twclid: fromCampaign('twclid') ?? fromProps('twclid'),
  }
}

function qualityFlag(eventType: string, props: Record<string, unknown>): string | null {
  const needsBlock =
    eventType === 'impression' ||
    eventType === 'viewability' ||
    eventType === 'click'
  if (needsBlock && !asString(props.block_id)) {
    return 'incomplete'
  }
  if (eventType === 'ad_request' && !asString(props.ad_request_id)) {
    return 'incomplete'
  }
  return null
}

export function normalizeCollectEvent(event: CollectEvent): FlatEvent {
  const { messageId, anonymousId, userId } = readIdentity(event)
  const sessionId = readSessionId(event)
  const eventType = resolveEventType(event)
  const ctx = event.context ?? {}
  const props = asRecord(event.properties)
  const traits = asRecord(event.traits)
  const campaign = asRecord(ctx.campaign)
  const page = asRecord(ctx.page)
  const attribution = pickAttribution(campaign, props)

  const emailRaw = traits.email ?? traits.email_hash
  const phoneRaw = traits.phone ?? traits.phone_hash

  return {
    message_id: messageId,
    anonymous_id: anonymousId,
    user_id: userId,
    session_id: sessionId,
    event_type: eventType,
    timestamp: asString(event.timestamp),
    // Legacy envelope v2 only — native SDK events never emit originalTimestamp.
    original_timestamp:
      asString((event as { original_timestamp?: string }).original_timestamp) ??
      asString(event.originalTimestamp),
    sent_at: asString(event.sentAt) ?? asString((event as { sent_at?: string }).sent_at),
    retry_count: event._metadata?.retryCount ?? 0,
    page_url: asString(page.url),
    page_path: asString(props.page_path) ?? asString(page.path),
    page_title: asString(page.title),
    referrer: asString(page.referrer),
    ...attribution,
    block_id: asString(props.block_id),
    block_position: asNumber(props.block_position),
    ad_request_id: asString(props.ad_request_id),
    viewable: asBoolean(props.viewable),
    visitor_country: asString(props.visitor_country),
    country: asString(props.country),
    vertical: asString(props.vertical),
    product: asString(props.product),
    funnel: asString(props.funnel),
    email_hash: hashPiiField(emailRaw),
    phone_hash: hashPiiField(phoneRaw),
    email_domain: asString(traits.email_domain),
    quality_flag: qualityFlag(eventType, props),
    properties_json: JSON.stringify(props),
    context_json: JSON.stringify(ctx),
  }
}

export function normalizeCollectBatch(events: CollectEvent[]): FlatEvent[] {
  return events.map(normalizeCollectEvent)
}
