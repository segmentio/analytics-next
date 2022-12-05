import {
  CoreAnalyticsTraits,
  CoreExtraContext,
  CorePlugin,
  EventProperties,
  Integrations,
  Timestamp,
} from '@segment/analytics-core'

export interface Plugin extends CorePlugin {}

/**
 * Traits are pieces of information you know about a user that are included in an identify call. These could be demographics like age or gender, account-specific like plan, or even things like whether a user has seen a particular A/B test variation. Up to you!
 * Segment has reserved some traits that have semantic meanings for users, and we handle them in special ways. For example, Segment always expects email to be a string of the user’s email address.
 *
 * We’ll send this on to destinations like Mailchimp that require an email address for their tracking.
 *
 * You should only use reserved traits for their intended meaning.
 */
export interface Traits extends CoreAnalyticsTraits {}

/**
 * An ID associated with the user. Note: at least one of userId or anonymousId must be included.
 **/
type IdentityOptions =
  | { userId: string; anonymousId?: string }
  | { userId?: string; anonymousId: string }

/**
 * A dictionary of extra context to attach to the call.
 * Note: context differs from traits because it is not attributes of the user itself.
 */
export interface ExtraContext extends CoreExtraContext {}

export type AliasParams = {
  /* The new user id you want to associate with the user. */
  userId: string
  /* The previous id that the user was recognized by (this can be either a userId or an anonymousId). */
  previousId: string
  context?: ExtraContext
  timestamp?: Timestamp
  integrations?: Integrations
}
export type GroupParams = IdentityOptions & {
  groupId: string
  traits?: Traits
  context?: ExtraContext
  timestamp?: Timestamp
  integrations?: Integrations
}

export type IdentifyParams = IdentityOptions & {
  traits?: Traits
  context?: ExtraContext
  integrations?: Integrations
}

export type PageParams = IdentityOptions & {
  /*  The category of the page. Useful for cases like ecommerce where many pages might live under a single category. */
  category?: string
  /* The name of the page.*/
  name?: string
  /* A dictionary of properties of the page. */
  properties?: EventProperties
  timestamp?: Timestamp
  context?: ExtraContext
  integrations?: Integrations
}

export type TrackParams = IdentityOptions & {
  event: string
  properties?: EventProperties
  context?: ExtraContext
  timestamp?: Timestamp
  integrations?: Integrations
}
