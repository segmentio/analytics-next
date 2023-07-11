import {
  AnyAnalytics,
  Categories,
  createWrapper,
  CreateWrapperSettings,
  resolveWhen,
} from '@segment/analytics-consent-tools'

import {
  isAllTrackingDisabled,
  getConsentedGroupIds,
  getGroupData,
  getOneTrustGlobal,
} from '../lib/onetrust-api'

interface OneTrustOptions {
  integrationCategoryMappings?: CreateWrapperSettings['integrationCategoryMappings']
}

export const oneTrust = (
  analytics: AnyAnalytics,
  options: OneTrustOptions = {}
) =>
  createWrapper({
    shouldLoad: async (ctx) => {
      await resolveWhen(() => {
        const oneTrustGlobal = getOneTrustGlobal()
        return (
          oneTrustGlobal !== undefined &&
          Boolean(getConsentedGroupIds().length) &&
          oneTrustGlobal.IsAlertBoxClosed()
        )
      }, 500)

      const trackingDisabled = isAllTrackingDisabled(getConsentedGroupIds())
      if (trackingDisabled) {
        ctx.abort({
          loadSegmentNormally: false,
        })
      }
    },
    getCategories: (): Categories => {
      // TODO: Do we check if *all* the destination's mapped cookie categories are consented by the user in the browser.?
      // so basically, if a user has 2 categories defined in the UI: [Functional, Advertising],
      // we need _all_ those categories to be valid

      // Scenarios:
      // - if the user is being asked to select categories, so the popup is still visible
      // - if user has no categories selected because they deliberately do not consent to anything and the popup has been dismissed in this session
      // - if user has selected categories in a past session
      // - if the user has selected categories this session
      // - if user has no categories selected because they deliberately do not consent to anything and the popup was dismissed in a previous session
      const { userSetConsentGroups, userDeniedConsentGroups } = getGroupData()
      // TODO: filter by relevent categories
      const consentedCategories = userSetConsentGroups.reduce<Categories>(
        (acc, c) => {
          return {
            ...acc,
            [c.groupName]: true,
            [c.customGroupId]: true,
          }
        },
        {}
      )

      const deniedCategories = userDeniedConsentGroups.reduce<Categories>(
        (acc, c) => {
          return {
            ...acc,
            [c.groupName]: false,
            [c.customGroupId]: false,
          }
        },
        {}
      )
      return { ...consentedCategories, ...deniedCategories }
    },
    integrationCategoryMappings: options.integrationCategoryMappings,
  })(analytics)
