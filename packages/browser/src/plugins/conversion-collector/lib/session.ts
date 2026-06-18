import { generateUuidV4, isValidUuidV4 } from './uuid'

export {
  getOrCreateSessionId,
  getCurrentSessionId,
  SESSION_COOKIE,
  ACTIVITY_COOKIE,
  SESSION_INACTIVITY_MS,
} from '../session-enrichment/session-manager'

export { SESSION_INACTIVITY_MS as SESSION_INACTIVITY_TTL_MS } from '../session-enrichment/session-manager'

const ANONYMOUS_ID_KEY = 'utua_anonymous_id'

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
