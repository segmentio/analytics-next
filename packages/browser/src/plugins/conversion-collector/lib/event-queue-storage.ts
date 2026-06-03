import type { AnalyticsEventEnvelope } from '../types'

export const EVENT_QUEUE_STORAGE_KEY = 'utua_event_queue'
export const MAX_PERSISTED_EVENTS = 100
export const MAX_PERSISTED_BYTES = 1024 * 1024

function isBrowserStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    const key = '__utua_storage_probe__'
    window.localStorage.setItem(key, '1')
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

function isValidEnvelope(value: unknown): value is AnalyticsEventEnvelope {
  if (!value || typeof value !== 'object') {
    return false
  }
  const envelope = value as AnalyticsEventEnvelope
  return (
    (envelope.type === 'track' || envelope.type === 'identify') &&
    typeof envelope.anonymous_id === 'string' &&
    typeof envelope.message_id === 'string' &&
    typeof envelope.timestamp === 'string' &&
    envelope.version === 2 &&
    typeof envelope.context === 'object'
  )
}

function trimQueue(events: AnalyticsEventEnvelope[]): AnalyticsEventEnvelope[] {
  let trimmed = events.slice(-MAX_PERSISTED_EVENTS)
  while (trimmed.length > 0) {
    const serialized = JSON.stringify(trimmed)
    if (serialized.length <= MAX_PERSISTED_BYTES) {
      return trimmed
    }
    trimmed = trimmed.slice(1)
  }
  return []
}

export function readPersistedEventQueue(): AnalyticsEventEnvelope[] {
  if (!isBrowserStorageAvailable()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(EVENT_QUEUE_STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(isValidEnvelope)
  } catch {
    return []
  }
}

export function writePersistedEventQueue(
  events: AnalyticsEventEnvelope[]
): void {
  if (!isBrowserStorageAvailable()) {
    return
  }

  try {
    if (events.length === 0) {
      window.localStorage.removeItem(EVENT_QUEUE_STORAGE_KEY)
      return
    }

    const trimmed = trimQueue(events)
    if (trimmed.length === 0) {
      window.localStorage.removeItem(EVENT_QUEUE_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(
      EVENT_QUEUE_STORAGE_KEY,
      JSON.stringify(trimmed)
    )
  } catch {
    // Quota exceeded or storage blocked — drop persistence silently.
  }
}

export function clearPersistedEventQueue(): void {
  if (!isBrowserStorageAvailable()) {
    return
  }

  try {
    window.localStorage.removeItem(EVENT_QUEUE_STORAGE_KEY)
  } catch {
    // ignore
  }
}
