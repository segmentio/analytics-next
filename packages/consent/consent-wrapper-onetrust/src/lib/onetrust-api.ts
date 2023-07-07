/**
 * @example
 * ",CAT001,FOO456" => ["CAT001", "FOO456"]
 */
const normalizeActiveGroupIds = (c: string): string[] =>
  c.trim().split(',').filter(Boolean)

type GroupInfoDto = {
  CustomGroupId: string
  GroupName: string
}

/**
 * The data model used by the OneTrust lib
 */
interface OneTrustGlobal {
  GetDomainData: () => {
    Groups: GroupInfoDto[]
  }
  /**
   *  This callback appears to fire whenever the alert box is closed, no matter what.
   * E.g:
   * - if a user continues without accepting
   * - if a user makes a selection
   * - if a user rejects all
   */
  onConsentChanged: (cb: (groupIds: string[]) => void) => void
  IsAlertBoxClosed: () => boolean
}

export const getOneTrustGlobal = (): OneTrustGlobal | undefined =>
  (window as any).OneTrust

const getOneTrustActiveGroups = (): string | undefined =>
  (window as any).OnetrustActiveGroups

export const getConsentedGroupIds = (): string[] => {
  const groups = getOneTrustActiveGroups()
  if (!groups) {
    return []
  }
  return normalizeActiveGroupIds(groups || '')
}

export type GroupInfo = {
  customGroupId: string
  groupName: string
}

const normalizeGroupInfo = (groupInfo: GroupInfoDto): GroupInfo => ({
  customGroupId: groupInfo.CustomGroupId.trim(),
  groupName: groupInfo.GroupName.trim(), // should we allow groupName?
})

/**
 * get *all* groups / categories, not just active ones
 */
const getAllGroups = (): GroupInfo[] => {
  const oneTrustGlobal = getOneTrustGlobal()
  if (!oneTrustGlobal) return []
  return oneTrustGlobal.GetDomainData().Groups.map(normalizeGroupInfo)
}

type UserConsentGroupData = {
  userSetConsentGroups: GroupInfo[]
  userDeniedConsentGroups: GroupInfo[]
}

// derive the groupIds from the active groups
export const getGroupData = (): UserConsentGroupData => {
  const userSetConsentGroupIds = getConsentedGroupIds()

  // partition all groups into "consent" or "deny"
  const userConsentGroupData = getAllGroups().reduce<UserConsentGroupData>(
    (acc, group) => {
      if (userSetConsentGroupIds.includes(group.customGroupId)) {
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

/**
 * The website needs these cookies in order to function properly (example: identify items placed into a shopping cart).
 * This category is enabled by default, even if user has not made a selection.
 */
const STRICTLY_NECCESSARY_CATEGORY = 'C0001'

export const isAllTrackingDisabled = (groupIds: string[]): boolean => {
  return groupIds.length === 1 && groupIds[0] === STRICTLY_NECCESSARY_CATEGORY
}
