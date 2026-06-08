import type { CollectEvent, LegacyEventEnvelope } from './types'
import { asRecord } from './validation'

export class CollectBodyError extends Error {
  readonly code = 'invalid_body'

  constructor(message: string) {
    super(message)
    this.name = 'CollectBodyError'
  }
}

function legacyToNative(envelope: LegacyEventEnvelope): CollectEvent {
  return {
    type: envelope.type,
    event: envelope.event_name,
    anonymousId: envelope.anonymous_id,
    userId: envelope.user_id,
    traits: envelope.traits,
    properties: envelope.properties,
    context: envelope.context,
    messageId: envelope.message_id,
    timestamp: envelope.timestamp,
    sentAt: envelope.sent_at,
    original_timestamp: envelope.original_timestamp,
  }
}

function isLegacyEnvelope(value: unknown): value is LegacyEventEnvelope {
  if (!value || typeof value !== 'object') {
    return false
  }
  const envelope = value as LegacyEventEnvelope
  return (
    (envelope.type === 'track' || envelope.type === 'identify') &&
    typeof envelope.anonymous_id === 'string' &&
    typeof envelope.message_id === 'string'
  )
}

function isNativeEvent(value: unknown): value is CollectEvent {
  if (!value || typeof value !== 'object') {
    return false
  }
  const event = value as CollectEvent
  const type = event.type
  if (
    type !== 'track' &&
    type !== 'page' &&
    type !== 'identify' &&
    type !== 'screen'
  ) {
    return false
  }
  const anonymousId = event.anonymousId ?? (event as { anonymous_id?: string }).anonymous_id
  const messageId = event.messageId ?? (event as { message_id?: string }).message_id
  return typeof anonymousId === 'string' && typeof messageId === 'string'
}

/**
 * Accepts native array `[event, ...]` or legacy `{ events: [...] }` (envelope v2).
 */
export function parseCollectBody(raw: unknown): CollectEvent[] {
  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      throw new CollectBodyError('Collect body must contain at least one event')
    }
    const events = raw.filter(isNativeEvent)
    if (events.length !== raw.length) {
      throw new CollectBodyError('Collect body contains invalid events')
    }
    return events
  }

  const wrapper = asRecord(raw)
  const legacyEvents = wrapper.events
  if (Array.isArray(legacyEvents)) {
    if (legacyEvents.length === 0) {
      throw new CollectBodyError('Collect body must contain at least one event')
    }
    const events = legacyEvents.filter(isLegacyEnvelope).map(legacyToNative)
    if (events.length !== legacyEvents.length) {
      throw new CollectBodyError('Collect body contains invalid legacy envelopes')
    }
    return events
  }

  throw new CollectBodyError(
    'Collect body must be a JSON array or { events: [...] }'
  )
}
