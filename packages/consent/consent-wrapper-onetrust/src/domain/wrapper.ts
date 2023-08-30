import {
  AnyAnalytics,
  createWrapper,
  CreateWrapperSettings,
  RegisterOnConsentChangedFunction,
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
export const withOneTrust = <Analytics extends AnyAnalytics>(
  analyticsInstance: Analytics,
  settings: OneTrustSettings = {}
): Analytics => {
  const registerOnConsentChanged: RegisterOnConsentChangedFunction = async (
    onCategoriesChangedCb
  ) => {
    await resolveWhen(() => getOneTrustGlobal() !== undefined, 500)
    getOneTrustGlobal()!.OnConsentChanged((event) => {
      const normalizedCategories = getNormalizedCategoriesFromGroupIds(
        event.detail
      )
      onCategoriesChangedCb(normalizedCategories)
    })
  }
  return createWrapper<Analytics>({
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
      : registerOnConsentChanged,
    integrationCategoryMappings: settings.integrationCategoryMappings,
  })(analyticsInstance)
}
