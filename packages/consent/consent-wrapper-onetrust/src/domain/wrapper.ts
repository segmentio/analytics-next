import {
  AnyAnalytics,
  createWrapper,
  CreateWrapperSettings,
  resolveWhen,
} from '@segment/analytics-consent-tools'

import {
  getNormalizedCategoriesFromGroupData,
  getNormalizedCategoriesFromGroupIds,
  getConsentedGroupIds,
  getOneTrustGlobal,
} from '../lib/onetrust-api'

interface OneTrustSettings {
  integrationCategoryMappings?: CreateWrapperSettings['integrationCategoryMappings']
  disableConsentChangedEvent?: boolean
}

export const oneTrust = (
  analytics: AnyAnalytics,
  settings: OneTrustSettings = {}
) => {
  createWrapper({
    shouldLoad: async () => {
      await resolveWhen(() => {
        const oneTrustGlobal = getOneTrustGlobal()
        return (
          oneTrustGlobal !== undefined &&
          Boolean(getConsentedGroupIds().length) &&
          oneTrustGlobal.IsAlertBoxClosed()
        )
      }, 500)
    },
    getCategories: () => {
      const results = getNormalizedCategoriesFromGroupData()
      return results
    },
    registerOnConsentChanged: settings.disableConsentChangedEvent
      ? undefined
      : (onCategoriesChangedCb) =>
          getOneTrustGlobal()?.OnConsentChanged((categories) => {
            const normalizedCategories =
              getNormalizedCategoriesFromGroupIds(categories)
            onCategoriesChangedCb(normalizedCategories)
          }),
    integrationCategoryMappings: settings.integrationCategoryMappings,
  })(analytics)
}
