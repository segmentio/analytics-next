import {
  Categories,
  CDNSettings,
  CDNSettingsConsent,
  CreateWrapperSettings,
} from '../types'
import { logger } from './logger'
import { parseConsentCategories } from './config-helpers'

/**
 * @returns whether or not analytics.js should be completely disabled (never load, or drop cookies)
 */
export const segmentShouldBeDisabled = (
  categories: Categories,
  consentSettings: CDNSettingsConsent | undefined
): boolean => {
  if (!consentSettings || consentSettings.hasUnmappedDestinations) {
    return false
  }

  // disable if _all_ of the the consented categories are irrelevant to segment
  return Object.keys(categories)
    .filter((c) => categories[c])
    .every((c) => !consentSettings.allCategories.includes(c))
}

const isIntegrationCategoryEnabled = (
  categories: string[],
  userCategories: Categories
) => {
  const isMissingCategories = !categories || !categories.length

  // Enable integration by default if it contains no consent categories data (most likely because consent has not been configured).
  if (isMissingCategories) {
    return true
  }
  // Enable integration by default if it contains no consent categories data (most likely because consent has not been configured).
  const isEnabled = categories.every((c) => userCategories[c])
  return isEnabled
}

export const shouldEnableIntegrationHelper = (
  creationName: string,
  cdnSettings: CDNSettings,
  userCategories: Categories,
  filterSettings: DeviceModeFilterSettings = {}
) => {
  const { integrationCategoryMappings, shouldEnableIntegration } =
    filterSettings

  const categories =
    (integrationCategoryMappings
      ? integrationCategoryMappings[creationName]
      : parseConsentCategories(cdnSettings.integrations[creationName])) ?? []

  // allow user to customize consent logic if needed
  if (shouldEnableIntegration) {
    return shouldEnableIntegration(categories, userCategories, {
      creationName,
    })
  }

  return isIntegrationCategoryEnabled(categories, userCategories)
}

export type DeviceModeFilterSettings = Pick<
  CreateWrapperSettings,
  'shouldEnableIntegration' | 'integrationCategoryMappings'
>
/**
 * For opt-in tracking, ensure that device mode destinations that are not consented to are not loaded at all..
 * This means that the destinations are never loaded. By disabling them here,  they can never drop their own cookies or track users.
 * On the downside, it means that the user will not be able to opt-in to these destinations without a page refresh.
 */
export const filterDeviceModeDestinationsForOptIn = (
  cdnSettings: CDNSettings,
  consentedCategories: Categories,
  filterSettings: DeviceModeFilterSettings
): CDNSettings => {
  const { remotePlugins, integrations } = cdnSettings
  const { integrationCategoryMappings, shouldEnableIntegration } =
    filterSettings

  if (!remotePlugins) {
    return cdnSettings
  }

  const cdnSettingsCopy: CDNSettings = {
    ...cdnSettings,
    remotePlugins: [...(remotePlugins || [])],
    integrations: { ...integrations },
  }

  const _shouldEnableIntegrationHelper = (creationName: string) => {
    return shouldEnableIntegrationHelper(
      creationName,
      cdnSettings,
      consentedCategories,
      {
        integrationCategoryMappings,
        shouldEnableIntegration,
      }
    )
  }
  for (const creationName in integrations) {
    if (!_shouldEnableIntegrationHelper(creationName)) {
      logger.debug(`Disabled (opt-in): ${creationName}`)
      cdnSettingsCopy.remotePlugins = remotePlugins.filter(
        (p) => p.creationName !== creationName
      )
      // remove disabled classic destinations and locally-installed action destinations
      delete cdnSettingsCopy.integrations[creationName]
    } else {
      logger.debug(`Enabled (opt-in): ${creationName}`)
    }
  }
  return cdnSettingsCopy
}
