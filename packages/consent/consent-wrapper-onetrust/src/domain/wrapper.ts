import {
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

export interface OneTrustSettings {
  integrationCategoryMappings?: CreateWrapperSettings['integrationCategoryMappings']
  disableConsentChangedEvent?: boolean
}

/**
 *
 * @param analyticsInstance - An analytics instance. Either `window.analytics`, or the instance returned by `new AnalyticsBrowser()` or `AnalyticsBrowser.load({...})`
 * @param settings - Optional settings for configuring your OneTrust wrapper
 */
export const withOneTrust = <Analytics extends object>(
  analyticsInstance: Analytics, // typing this as 'object', rather than AnyAnalytics to avoid misc type mismatches. createWrapper will throw an error if the analytics instance is not compatible.
  settings: OneTrustSettings = {}
): Analytics => {
  return createWrapper({
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
          getOneTrustGlobal()?.OnConsentChanged((event) => {
            const normalizedCategories = getNormalizedCategoriesFromGroupIds(
              event.detail
            )
            onCategoriesChangedCb(normalizedCategories)
          }),
    integrationCategoryMappings: settings.integrationCategoryMappings,
  })(analyticsInstance)
}
