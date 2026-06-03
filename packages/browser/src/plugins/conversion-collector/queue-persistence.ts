import type { AnalyticsEventEnvelope } from './types'

export const DEFAULT_QUEUE_PERSISTENCE_KEY = '__bg_analytics_collect_queue_v1'
export const DEFAULT_MAX_QUEUE_SIZE = 500

export function loadPersistedQueue(
  key: string = DEFAULT_QUEUE_PERSISTENCE_KEY
): AnalyticsEventEnvelope[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed as AnalyticsEventEnvelope[]
  } catch {
    return []
  }
}

export function savePersistedQueue(
  events: AnalyticsEventEnvelope[],
  maxSize: number = DEFAULT_MAX_QUEUE_SIZE,
  key: string = DEFAULT_QUEUE_PERSISTENCE_KEY
): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const trimmed =
      events.length > maxSize ? events.slice(events.length - maxSize) : events
    window.localStorage.setItem(key, JSON.stringify(trimmed))
  } catch {
    // localStorage full or unavailable
  }
}

export function clearPersistedQueue(
  key: string = DEFAULT_QUEUE_PERSISTENCE_KEY
): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}
