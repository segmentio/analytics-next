import { generateUuidV4, isValidUuidV4 } from './uuid'

const SESSION_ID_COOKIE = '__bg_analytics_session_id'
const SESSION_ACTIVITY_COOKIE = '__bg_analytics_session_activity'
const ANONYMOUS_ID_KEY = '__bg_analytics_anonymous_id'

/** Inactivity window aligned with PRD / Redis finalizer (5 minutes). */
export const SESSION_INACTIVITY_TTL_MS = 5 * 60 * 1000

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
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function touchSessionCookies(sessionId: string, activityMs: number): void {
  const maxAgeSec = SESSION_INACTIVITY_TTL_MS / 1000
  setCookie(SESSION_ID_COOKIE, sessionId, maxAgeSec)
  setCookie(SESSION_ACTIVITY_COOKIE, String(activityMs), maxAgeSec)
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return generateUuidV4()
  }

  const now = Date.now()

  try {
    const existingId = getCookie(SESSION_ID_COOKIE)
    const lastActivityRaw = getCookie(SESSION_ACTIVITY_COOKIE)
    const lastActivity = lastActivityRaw ? Number(lastActivityRaw) : 0

    if (
      existingId &&
      isValidUuidV4(existingId) &&
      lastActivity > 0 &&
      now - lastActivity <= SESSION_INACTIVITY_TTL_MS
    ) {
      touchSessionCookies(existingId, now)
      return existingId
    }
  } catch {
    // fall through to new session
  }

  const nextId = generateUuidV4()
  try {
    touchSessionCookies(nextId, now)
  } catch {
    // cookie unavailable
  }
  return nextId
}

export function getOrCreateAnonymousId(): string {
  if (typeof window === 'undefined') {
    return generateUuidV4()
  }

  try {
    const existing = window.localStorage?.getItem(ANONYMOUS_ID_KEY)
    if (existing && isValidUuidV4(existing)) {
      return existing
    }

    const nextId = generateUuidV4()
    window.localStorage?.setItem(ANONYMOUS_ID_KEY, nextId)
    return nextId
  } catch {
    return generateUuidV4()
  }
}
