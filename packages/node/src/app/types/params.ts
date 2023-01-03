import type {
  CoreTraits,
  CoreGroupTraits,
  CoreUserTraits,
  CoreExtraContext,
  EventProperties,
  Integrations,
  Timestamp,
} from '@segment/analytics-core'

export interface Traits extends CoreTraits {}

/**
 * Traits are pieces of information you know about a group.
 * This interface represents reserved traits that Segment has standardized.
 * @link https://segment.com/docs/connections/spec/group/#traits
 */
export interface GroupTraits extends CoreGroupTraits {}

/**
 * Traits are pieces of information you know about a user.
 * This interface represents reserved traits that Segment has standardized.
 * @link https://segment.com/docs/connections/spec/identify/#traits
 */
export interface UserTraits extends CoreUserTraits {}

/**
 * A dictionary of extra context to attach to the call.
 * Note: context differs from traits because it is not attributes of the user itself.
 */
export interface ExtraContext extends CoreExtraContext {}

/**
 * An ID associated with the user. Note: at least one of userId or anonymousId must be included.
 **/
type IdentityOptions =
  | { userId: string; anonymousId?: string }
  | { userId?: string; anonymousId: string }

export type AliasParams = {
  /* The new user id you want to associate with the user. */
  userId: string
  /* The previous id that the user was recognized by (this can be either a userId or an anonymousId). */
  previousId: string
  context?: ExtraContext
  timestamp?: Timestamp
  integrations?: Integrations
}

export type GroupParams = {
  groupId: string
  traits?: GroupTraits
  context?: ExtraContext
  timestamp?: Timestamp
  integrations?: Integrations
} & IdentityOptions

export type IdentifyParams = {
  traits?: UserTraits
  context?: ExtraContext
  integrations?: Integrations
} & IdentityOptions

export type PageParams = {
  /*  The category of the page. Useful for cases like ecommerce where many pages might live under a single category. */
  category?: string
  /* The name of the page.*/
  name?: string
  /* A dictionary of properties of the page. */
  properties?: EventProperties
  timestamp?: Timestamp
  context?: ExtraContext
  integrations?: Integrations
} & IdentityOptions

export type TrackParams = {
  event: string
  properties?: EventProperties
  context?: ExtraContext
  timestamp?: Timestamp
  integrations?: Integrations
} & IdentityOptions
