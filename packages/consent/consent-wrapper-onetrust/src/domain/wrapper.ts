import {
  AnyAnalytics,
  Categories,
  createWrapper,
  CreateWrapperSettings,
  resolveWhen,
} from '@segment/analytics-consent-tools'

import {
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
    getCategories: (): Categories => {
      // so basically, if a user has 2 categories defined in the UI: [Functional, Advertising],
      // we need _all_ those categories to be valid

      // Scenarios:
      // - if the user is being asked to select categories, so the popup is still visible
      // - if user has no categories selected because they deliberately do not consent to anything and the popup has been dismissed in this session
      // - if user has selected categories in a past session
      // - if the user has selected categories this session
      // - if user has no categories selected because they deliberately do not consent to anything and the popup was dismissed in a previous session
      const { userSetConsentGroups, userDeniedConsentGroups } = getGroupData()
      const consentedCategories = userSetConsentGroups.reduce<Categories>(
        (acc, c) => {
          return {
            ...acc,
            [c.groupId]: true,
          }
        },
        {}
      )

      const deniedCategories = userDeniedConsentGroups.reduce<Categories>(
        (acc, c) => {
          return {
            ...acc,
            [c.groupId]: false,
          }
        },
        {}
      )
      return { ...consentedCategories, ...deniedCategories }
    },
    integrationCategoryMappings: options.integrationCategoryMappings,
  })(analytics)
