import { Categories, CDNSettingsConsent } from '../types'

/**
 * @returns whether or not analytics.js should be completely disabled (never load, or drop cookies)
 */
export const segmentShouldBeDisabled = (
  consentCategories: Categories,
  consentSettings: CDNSettingsConsent | undefined
): boolean => {
  if (!consentSettings || consentSettings.hasUnmappedDestinations) {
    return false
  }

  // disable if _all_ of the the consented categories are irrelevant to segment
  return Object.keys(consentCategories)
    .filter((c) => consentCategories[c])
    .every((c) => !consentSettings.allCategories.includes(c))
}
