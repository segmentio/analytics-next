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
  return createWrapper<Analytics>({
    // wait for OneTrust global to be available before wrapper is loaded
    shouldLoadWrapper: async () => {
      await resolveWhen(() => getOneTrustGlobal() !== undefined, 500)
    },
    // wait for AlertBox to be closed before segment can be loaded. If no consented groups, do not load Segment.
    shouldLoadSegment: async () => {
      await resolveWhen(() => {
        const OneTrust = getOneTrustGlobal()!
        return (
          // if any groups at all are consented to
          Boolean(getConsentedGroupIds().length) &&
          // if show banner is unchecked in the UI
          (OneTrust.GetDomainData().ShowAlertNotice === false ||
            // if alert box is closed by end user
            OneTrust.IsAlertBoxClosed())
        )
      }, 500)
    },
    getCategories: () => {
      const results = getNormalizedCategoriesFromGroupData()
      return results
    },
    registerOnConsentChanged: settings.disableConsentChangedEvent
      ? undefined
      : (onCategoriesChangedCb) => {
          getOneTrustGlobal()!.OnConsentChanged((event) => {
            const normalizedCategories = getNormalizedCategoriesFromGroupIds(
              event.detail
            )
            onCategoriesChangedCb(normalizedCategories)
          })
        },
    integrationCategoryMappings: settings.integrationCategoryMappings,
  })(analyticsInstance)
}
