import type { CollectEvent } from '../types'

export const EVENT_QUEUE_STORAGE_KEY = 'utua_event_queue'
export const MAX_PERSISTED_EVENTS = 100
export const MAX_PERSISTED_BYTES = 1024 * 1024

const QUEUE_MUTEX_KEY = 'utua_event_queue:lock'
const LOCK_TIMEOUT_MS = 50
const MAX_LOCK_ATTEMPTS = 3
const TAB_LOCK_OWNER = `${Date.now()}-${Math.random()}`

type StorageLock = {
  expires: number
  owner: string
}

/**
 * Best-effort cross-tab mutex via localStorage. Not a true CAS lock — two tabs
 * can still race — but each tab only releases locks it owns.
 */
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

function tryAcquireLock(now: number): boolean {
  const rawLock = window.localStorage.getItem(QUEUE_MUTEX_KEY)
  const lock = rawLock ? (JSON.parse(rawLock) as StorageLock) : null
  if (lock !== null && now <= lock.expires) {
    return false
  }
  window.localStorage.setItem(
    QUEUE_MUTEX_KEY,
    JSON.stringify({ expires: now + LOCK_TIMEOUT_MS, owner: TAB_LOCK_OWNER })
  )
  return true
}

function releaseOwnedLock(): void {
  const rawLock = window.localStorage.getItem(QUEUE_MUTEX_KEY)
  if (!rawLock) {
    return
  }
  try {
    const lock = JSON.parse(rawLock) as StorageLock
    if (lock.owner === TAB_LOCK_OWNER) {
      window.localStorage.removeItem(QUEUE_MUTEX_KEY)
    }
  } catch {
    // ignore malformed lock
  }
}

function withStorageMutex(fn: () => void, attempt = 0): void {
  if (!isBrowserStorageAvailable()) {
    fn()
    return
  }

  const now = Date.now()
  if (tryAcquireLock(now)) {
    try {
      fn()
    } finally {
      releaseOwnedLock()
    }
    return
  }

  if (attempt < MAX_LOCK_ATTEMPTS) {
    setTimeout(() => withStorageMutex(fn, attempt + 1), LOCK_TIMEOUT_MS)
  } else {
    console.warn('[utua] queue lock timeout')
    fn()
  }
}

function isValidCollectEvent(value: unknown): value is CollectEvent {
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
  return (
    typeof event.messageId === 'string' &&
    typeof event.anonymousId === 'string' &&
    typeof event.timestamp === 'string'
  )
}

function trimQueue(events: CollectEvent[]): CollectEvent[] {
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

function writeQueueToStorage(events: CollectEvent[]): void {
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

export function readPersistedEventQueue(): CollectEvent[] {
  if (!isBrowserStorageAvailable()) {
    return []
  }

  let result: CollectEvent[] = []
  withStorageMutex(() => {
    try {
      const raw = window.localStorage.getItem(EVENT_QUEUE_STORAGE_KEY)
      if (!raw) {
        result = []
        return
      }
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) {
        result = []
        return
      }
      result = parsed.filter(isValidCollectEvent)
    } catch {
      result = []
    }
  })
  return result
}

export function writePersistedEventQueue(events: CollectEvent[]): void {
  if (!isBrowserStorageAvailable()) {
    return
  }

  withStorageMutex(() => {
    writeQueueToStorage(events)
  })
}

/** Synchronous write for page unload — avoids deferred mutex retries. */
export function writePersistedEventQueueSync(events: CollectEvent[]): void {
  if (!isBrowserStorageAvailable()) {
    return
  }

  const now = Date.now()
  if (tryAcquireLock(now)) {
    try {
      writeQueueToStorage(events)
    } finally {
      releaseOwnedLock()
    }
    return
  }

  writeQueueToStorage(events)
}

export function clearPersistedEventQueue(): void {
  if (!isBrowserStorageAvailable()) {
    return
  }

  withStorageMutex(() => {
    try {
      window.localStorage.removeItem(EVENT_QUEUE_STORAGE_KEY)
    } catch {
      // ignore
    }
  })
}
