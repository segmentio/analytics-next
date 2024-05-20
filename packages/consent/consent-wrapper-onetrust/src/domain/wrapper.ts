import {
  AnyAnalytics,
  createWrapper,
  CreateWrapperSettings,
  resolveWhen,
} from '@segment/analytics-consent-tools'

import {
  getNormalizedCategories,
  getNormalizedActiveGroupIds,
  getOneTrustGlobal,
  coerceConsentModel,
} from '../lib/onetrust-api'

export interface OneTrustSettings {
  integrationCategoryMappings?: CreateWrapperSettings['integrationCategoryMappings']
  disableConsentChangedEvent?: boolean
  /**
   * Override configured consent model
   * - `opt-in` (strict/GDPR) - wait for explicit consent before loading segment and all destinations.
   * - `opt-out`  (default) - load segment and all destinations without waiting for explicit consent.
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
    shouldLoadSegment: async (ctx) => {
      const OneTrust = getOneTrustGlobal()!
      const consentModel =
        settings.consentModel?.() ||
        coerceConsentModel(OneTrust.GetDomainData().ConsentModel.Name)

      if (consentModel === 'opt-out') {
        return ctx.load({
          consentModel: 'opt-out',
        })
      } else {
        await resolveWhen(() => {
          return (
            // if any groups at all are consented to
            Boolean(getNormalizedActiveGroupIds().length) &&
            // if show banner is unchecked in the UI
            (OneTrust.GetDomainData().ShowAlertNotice === false ||
              // if alert box is closed by end user
              OneTrust.IsAlertBoxClosed())
          )
        }, 500)
        return ctx.load({ consentModel: 'opt-in' })
      }
    },
    getCategories: () => {
      const results = getNormalizedCategories()
      return results
    },
    registerOnConsentChanged: settings.disableConsentChangedEvent
      ? undefined
      : (setCategories) => {
          getOneTrustGlobal()!.OnConsentChanged((event) => {
            const normalizedCategories = getNormalizedCategories(event.detail)
            setCategories(normalizedCategories)
          })
        },
    integrationCategoryMappings: settings.integrationCategoryMappings,
    enableDebugLogging: settings.enableDebugLogging,
  })(analyticsInstance)
}
