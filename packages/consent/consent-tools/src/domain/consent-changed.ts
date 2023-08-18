import { AnyAnalytics, Categories } from '../types'

/**
 * Dispatch an event that looks like:
 * ```ts
 * {
 * "type": "track",
 *  "event": "Segment Consent Preference",
 *  "context": {
 *    "consent": {
 *      "categoryPreferences" : {
 *         "C0001": true,
 *         "C0002": false,
 *    }
 *  }
 * ...
 * ```
 */
export const sendConsentChangedEvent = (
  analytics: AnyAnalytics,
  categories: Categories
): void => {
  analytics.track(
    CONSENT_CHANGED_EVENT,
    undefined,
    createConsentChangedCtxDto(categories)
  )
}

const CONSENT_CHANGED_EVENT = 'Segment Consent Preference'

const createConsentChangedCtxDto = (categories: Categories) => ({
  consent: {
    categoryPreferences: categories,
  },
})
