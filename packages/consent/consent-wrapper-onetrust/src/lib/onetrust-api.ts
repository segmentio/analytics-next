import { Categories, ConsentModel } from '@segment/analytics-consent-tools'
import { OneTrustApiValidationError } from './validation'
/**
 * @example ["C0001", "C0002"]
 */
type ActiveGroupIds = string[]

/**
 * @example
 * ",C0001,C0002" => ["C0001", "C0002"]
 */
const normalizeActiveGroupIds = (
  oneTrustActiveGroups: string
): ActiveGroupIds => {
  return oneTrustActiveGroups.trim().split(',').filter(Boolean)
}

type GroupInfoDto = {
  CustomGroupId: string
}

type OtConsentChangedEvent = CustomEvent<ActiveGroupIds>

export enum OtConsentModel {
  optIn = 'opt-in',
  optOut = 'opt-out',
  implicit = 'implied consent',
}

export interface OneTrustDomainData {
  ShowAlertNotice: boolean
  Groups: GroupInfoDto[]
  ConsentModel: {
    Name: OtConsentModel
  }
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
  // window.OneTrust = {...} is used for user configuration e.g. 'Consent Rate Optimization'
  // Also, if "show banner" is unchecked, window.OneTrust returns {geolocationResponse: {…}} before it actually returns the OneTrust object
  // Thus, we are doing duck typing to see when this object is 'ready'
  // function OptAnonWrapper()  is the idiomatic way to check if OneTrust is ready, but polling for this works
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

export const getNormalizedActiveGroupIds = (
  oneTrustActiveGroups = getOneTrustActiveGroups()
): ActiveGroupIds => {
  if (!oneTrustActiveGroups) {
    return []
  }
  return normalizeActiveGroupIds(oneTrustActiveGroups || '')
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

export const getNormalizedCategories = (
  activeGroupIds = getNormalizedActiveGroupIds()
): Categories => {
  return getAllGroups().reduce<Categories>((acc, group) => {
    return {
      ...acc,
      [group.groupId]: activeGroupIds.includes(group.groupId),
    }
  }, {})
}

/**
 *  We don't support all consent models, so we need to coerce them to the ones we do support.
 */
export const coerceConsentModel = (model: OtConsentModel): ConsentModel => {
  switch (model) {
    case OtConsentModel.optIn:
    case OtConsentModel.implicit:
      return 'opt-in'
    case OtConsentModel.optOut:
      return 'opt-out'
    default: // there are some others like 'custom' / 'notice' that should be treated as 'opt-out'
      return 'opt-out'
  }
}
