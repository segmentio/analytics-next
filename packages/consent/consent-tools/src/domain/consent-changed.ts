import { AnyAnalytics, Categories } from '../types'
import { getInitializedAnalytics } from './get-initialized-analytics'
import { validateCategories } from './validation'

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
  getInitializedAnalytics(analytics).track(
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

export const validateAndSendConsentChangedEvent = (
  analytics: AnyAnalytics,
  categories: Categories
) => {
  try {
    validateCategories(categories)
    sendConsentChangedEvent(analytics, categories)
  } catch (err) {
    // Not sure if there's a better way to handle this, but this makes testing a bit easier.
    console.error(err)
  }
}
