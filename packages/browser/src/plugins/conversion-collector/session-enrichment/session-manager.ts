import { generateUuidV4, isValidUuidV4 } from '../lib/uuid'

export const SESSION_COOKIE = '_utua_session'
export const ACTIVITY_COOKIE = '_utua_last_activity'
export const SESSION_LS_KEY = 'utua_session'
export const ACTIVITY_LS_KEY = 'utua_last_activity'

/** Inactivity window — aligned with PRD / Redis finalizer (5 minutes). */
export const SESSION_INACTIVITY_MS = 5 * 60 * 1000

/** Cookie max-age safety net (30 minutes). Real expiry is inactivity logic. */
export const SESSION_COOKIE_MAX_AGE_SEC = 30 * 60

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null
  }
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return match?.[1] != null ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') {
    return
  }
  const maxAge = Math.max(1, Math.ceil(maxAgeSeconds))
  const secure =
    typeof window !== 'undefined' && window.location?.protocol === 'https:'
      ? '; Secure'
      : ''
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`
}

function readLs(key: string): string | null {
  try {
    return window.localStorage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function writeLs(key: string, value: string): void {
  try {
    window.localStorage?.setItem(key, value)
  } catch {
    // storage blocked
  }
}

function touchSessionStorage(sessionId: string, activityMs: number): void {
  setCookie(SESSION_COOKIE, sessionId, SESSION_COOKIE_MAX_AGE_SEC)
  setCookie(ACTIVITY_COOKIE, String(activityMs), SESSION_COOKIE_MAX_AGE_SEC)
  writeLs(SESSION_LS_KEY, sessionId)
  writeLs(ACTIVITY_LS_KEY, String(activityMs))
}

export function getCurrentSessionId(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    const existingId = getCookie(SESSION_COOKIE) ?? readLs(SESSION_LS_KEY)
    if (existingId && isValidUuidV4(existingId)) {
      return existingId
    }
  } catch {
    // ignore
  }
  return undefined
}

export function getOrCreateSessionId(custom?: () => string): string {
  if (custom) {
    return custom()
  }

  if (typeof window === 'undefined') {
    return generateUuidV4()
  }

  const now = Date.now()

  try {
    const existingId = getCookie(SESSION_COOKIE) ?? readLs(SESSION_LS_KEY)
    const lastActivityRaw =
      getCookie(ACTIVITY_COOKIE) ?? readLs(ACTIVITY_LS_KEY)
    const lastActivity = lastActivityRaw ? Number(lastActivityRaw) : 0

    if (
      existingId &&
      isValidUuidV4(existingId) &&
      lastActivity > 0 &&
      now - lastActivity <= SESSION_INACTIVITY_MS
    ) {
      touchSessionStorage(existingId, now)
      return existingId
    }
  } catch {
    // fall through
  }

  const nextId = generateUuidV4()
  try {
    touchSessionStorage(nextId, now)
  } catch {
    // storage unavailable
  }
  return nextId
}
