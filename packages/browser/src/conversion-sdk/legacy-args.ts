import type { IdentifyLegacyInput, TrackLegacyInput } from './types'

export function normalizeTrackCall(
  event: TrackLegacyInput,
  payload?: Record<string, unknown>
): { eventName: string; properties: Record<string, unknown> } {
  const normalizedName =
    typeof event === 'string' ? event : event.eventName ?? 'unknown_event'
  const sourcePayload =
    typeof event === 'string' ? payload ?? {} : event.eventData ?? payload ?? {}
  const {
    event_name: _ignoredSnakeCase,
    eventName: _ignoredCamelCase,
    ...normalizedPayload
  } = sourcePayload ?? {}

  return {
    eventName: normalizedName,
    properties: normalizedPayload,
  }
}

function isIdentifyShape(
  value: IdentifyLegacyInput
): value is { userId?: string; traits?: Record<string, unknown> } {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('userId' in value || 'traits' in value)
  )
}

export function normalizeIdentifyCall(
  userOrEvent: IdentifyLegacyInput,
  traits?: Record<string, unknown>
): { userId?: string; traits: Record<string, unknown> } {
  if (typeof userOrEvent === 'string') {
    return { userId: userOrEvent, traits: traits ?? {} }
  }

  if (isIdentifyShape(userOrEvent)) {
    return {
      userId: userOrEvent.userId,
      traits: userOrEvent.traits ?? traits ?? {},
    }
  }

  return { traits: userOrEvent }
}
