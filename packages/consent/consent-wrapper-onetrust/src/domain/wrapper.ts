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
import { coerceConsentModel } from './consent-model'
export interface OneTrustSettings {
  integrationCategoryMappings?: CreateWrapperSettings['integrationCategoryMappings']
  disableConsentChangedEvent?: boolean
  /**
   * Override configured consent model
   * - opt-in  (default) - load segment and all destinations without waiting for explicit consent.
   * - opt-out (strict/GDPR) - wait for explicit consent before loading segment
   *
   * By default, the value is determined by `OneTrust.GetDomainData().ConsentModel` which is set in the OneTrust UI.
   */
  consentModel?: () => 'opt-in' | 'opt-out'
  /**
   * Enable debug logging for OneTrust wrapper
   */
  enableDebugLogging?: boolean
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
    shouldLoadSegment: async (ctx) => {
      const OneTrust = getOneTrustGlobal()!
      const consentModel =
        settings.consentModel?.() ||
        coerceConsentModel(OneTrust.GetDomainData().ConsentModel.Name)

      if (consentModel === 'opt-out') {
        return ctx.load({
          consentModel: 'opt-out',
        })
      }
      await resolveWhen(() => {
        return (
          // if any groups at all are consented to
          Boolean(getConsentedGroupIds().length) &&
          // if show banner is unchecked in the UI
          (OneTrust.GetDomainData().ShowAlertNotice === false ||
            // if alert box is closed by end user
            OneTrust.IsAlertBoxClosed())
        )
      }, 500)
      return ctx.load({ consentModel: 'opt-in' })
    },
    getCategories: () => {
      const results = getNormalizedCategoriesFromGroupData()
      return results
    },
    registerOnConsentChanged: settings.disableConsentChangedEvent
      ? undefined
      : (setCategories) => {
          getOneTrustGlobal()!.OnConsentChanged((event) => {
            const normalizedCategories = getNormalizedCategoriesFromGroupIds(
              event.detail
            )
            setCategories(normalizedCategories)
          })
        },
    integrationCategoryMappings: settings.integrationCategoryMappings,
    enableDebugLogging: settings.enableDebugLogging,
  })(analyticsInstance)
}
