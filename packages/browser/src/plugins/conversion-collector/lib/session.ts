import { generateUuidV4, isValidUuidV4 } from './uuid'

const SESSION_KEY = '__bg_analytics_session_id'
const ANONYMOUS_ID_KEY = '__bg_analytics_anonymous_id'

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return generateUuidV4()
  }

  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY)
    if (existing) {
      return existing
    }

    const nextId = generateUuidV4()
    window.sessionStorage.setItem(SESSION_KEY, nextId)
    return nextId
  } catch {
    return generateUuidV4()
  }
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
