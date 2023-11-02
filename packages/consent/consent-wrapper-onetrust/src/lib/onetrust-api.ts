import { Categories } from '@segment/analytics-consent-tools'
import { OneTrustApiValidationError } from './validation'
/**
 * @example ["C0001", "C0002"]
 */
type ConsentGroupIds = string[]

/**
 * @example
 * ",C0001,C0002" => ["C0001", "C0002"]
 */
const normalizeActiveGroupIds = (
  oneTrustActiveGroups: string
): ConsentGroupIds => {
  return oneTrustActiveGroups.trim().split(',').filter(Boolean)
}

type GroupInfoDto = {
  CustomGroupId: string
}

type OtConsentChangedEvent = CustomEvent<ConsentGroupIds>

export interface OneTrustDomainData {
  ShowAlertNotice: boolean
  Groups: GroupInfoDto[]
}
/**
 * The data model used by the OneTrust lib
 */
export interface OneTrustGlobal {
  GetDomainData: () => OneTrustDomainData
  /**
   *  This callback appears to fire whenever the alert box is closed, no matter what.
   * E.g:
   * - if a user continues without accepting
   * - if a user makes a selection
   * - if a user rejects all
   */
  OnConsentChanged: (cb: (event: OtConsentChangedEvent) => void) => void
  IsAlertBoxClosed: () => boolean
}

export const getOneTrustGlobal = (): OneTrustGlobal | undefined => {
  const oneTrust = (window as any).OneTrust
  if (!oneTrust) return undefined
  if (
    typeof oneTrust === 'object' &&
    'OnConsentChanged' in oneTrust &&
    'IsAlertBoxClosed' in oneTrust &&
    'GetDomainData' in oneTrust
  ) {
    return oneTrust
  }
  // if "show banner" is unchecked, window.OneTrust returns {geolocationResponse: {…}} before it actually returns the OneTrust object
  if ('geolocationResponse' in oneTrust) {
    return undefined
  }

  console.error(
    // OneTrust API has some gotchas -- since this function is often as a polling loop, not
    // throwing an error since it's possible that some setup is happening behind the scenes and
    // the OneTrust API is not available yet (e.g. see the geolocationResponse edge case).
    new OneTrustApiValidationError(
      'window.OneTrust is unexpected type',
      oneTrust
    ).message
  )
}

export const getOneTrustActiveGroups = (): string | undefined => {
  const groups = (window as any).OnetrustActiveGroups
  if (!groups) return undefined
  if (typeof groups !== 'string') {
    throw new OneTrustApiValidationError(
      `window.OnetrustActiveGroups is not a string`,
      groups
    )
  }
  return groups
}

export const getConsentedGroupIds = (
  groups = getOneTrustActiveGroups()
): ConsentGroupIds => {
  if (!groups) {
    return []
  }
  return normalizeActiveGroupIds(groups || '')
}

export type GroupInfo = {
  groupId: string
}

const normalizeGroupInfo = (groupInfo: GroupInfoDto): GroupInfo => ({
  groupId: groupInfo.CustomGroupId.trim(),
})

/**
 * get *all* groups / categories, not just active ones
 */
export const getAllGroups = (): GroupInfo[] => {
  const oneTrustGlobal = getOneTrustGlobal()
  if (!oneTrustGlobal) return []
  return oneTrustGlobal.GetDomainData().Groups.map(normalizeGroupInfo)
}

type UserConsentGroupData = {
  userSetConsentGroups: GroupInfo[]
  userDeniedConsentGroups: GroupInfo[]
}

// derive the groupIds from the active groups
export const getGroupDataFromGroupIds = (
  userSetConsentGroupIds = getConsentedGroupIds()
): UserConsentGroupData => {
  // partition all groups into "consent" or "deny"
  const userConsentGroupData = getAllGroups().reduce<UserConsentGroupData>(
    (acc, group) => {
      if (userSetConsentGroupIds.includes(group.groupId)) {
        acc.userSetConsentGroups.push(group)
      } else {
        acc.userDeniedConsentGroups.push(group)
      }
      return acc
    },
    { userSetConsentGroups: [], userDeniedConsentGroups: [] }
  )

  return userConsentGroupData
}

export const getNormalizedCategoriesFromGroupData = (
  groupData = getGroupDataFromGroupIds()
): Categories => {
  const { userSetConsentGroups, userDeniedConsentGroups } = groupData
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
}

export const getNormalizedCategoriesFromGroupIds = (
  groupIds: ConsentGroupIds
): Categories => {
  return getNormalizedCategoriesFromGroupData(
    getGroupDataFromGroupIds(groupIds)
  )
}
