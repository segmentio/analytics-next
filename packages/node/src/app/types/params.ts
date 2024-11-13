import type {
  GroupTraits,
  UserTraits,
  CoreExtraContext,
  EventProperties,
  Integrations,
  Timestamp,
} from '@segment/analytics-core'

export type { GroupTraits, UserTraits }

/**
 * A dictionary of extra context to attach to the call.
 * Note: context differs from traits because it is not attributes of the user itself.
 */
export interface ExtraContext extends CoreExtraContext {}

/**
 * An ID associated with the user. Note: at least one of userId or anonymousId must be included.
 **/
type IdentityOptions =
  | { userId: string; anonymousId?: string | undefined }
  | { userId?: string | undefined; anonymousId: string }

export type AliasParams = {
  /* The new user id you want to associate with the user. */
  userId: string
  /* The previous id that the user was recognized by (this can be either a userId or an anonymousId). */
  previousId: string
  context?: ExtraContext | undefined
  timestamp?: Timestamp | undefined
  integrations?: Integrations | undefined
  /**
   * Override the default messageId for the purposes of deduping events. Using a uuid library is strongly encouraged.
   * @link https://segment.com/docs/partners/faqs/#does-segment-de-dupe-messages
   */
  messageId?: string | undefined
}

export type GroupParams = {
  groupId: string
  /**
   * Traits are pieces of information you know about a group.
   * This interface represents reserved traits that Segment has standardized.
   * @link https://segment.com/docs/connections/spec/group/#traits
   */
  traits?: GroupTraits | undefined
  context?: ExtraContext | undefined
  timestamp?: Timestamp | undefined
  integrations?: Integrations | undefined
  /**
   * Override the default messageId for the purposes of deduping events. Using a uuid library is strongly encouraged.
   * @link https://segment.com/docs/partners/faqs/#does-segment-de-dupe-messages
   */
  messageId?: string | undefined
} & IdentityOptions

export type IdentifyParams = {
  /**
   * Traits are pieces of information you know about a group.
   * This interface represents reserved traits that Segment has standardized.
   * @link https://segment.com/docs/connections/spec/group/#traits
   */
  traits?: UserTraits | undefined
  context?: ExtraContext | undefined
  timestamp?: Timestamp | undefined
  integrations?: Integrations | undefined
  /**
   * Override the default messageId for the purposes of deduping events. Using a uuid library is strongly encouraged.
   * @link https://segment.com/docs/partners/faqs/#does-segment-de-dupe-messages
   */
  messageId?: string | undefined
} & IdentityOptions

export type PageParams = {
  /*  The category of the page. Useful for cases like ecommerce where many pages might live under a single category. */
  category?: string | undefined
  /* The name of the page.*/
  name?: string | undefined
  /* A dictionary of properties of the page. */
  properties?: EventProperties | undefined
  timestamp?: Timestamp | undefined
  context?: ExtraContext | undefined
  integrations?: Integrations | undefined
  /**
   * Override the default messageId for the purposes of deduping events. Using a uuid library is strongly encouraged.
   * @link https://segment.com/docs/partners/faqs/#does-segment-de-dupe-messages
   */
  messageId?: string | undefined
} & IdentityOptions

export type TrackParams = {
  event: string
  properties?: EventProperties | undefined
  context?: ExtraContext | undefined
  timestamp?: Timestamp | undefined
  integrations?: Integrations | undefined
  /**
   * Override the default messageId for the purposes of deduping events. Using a uuid library is strongly encouraged.
   * @link https://segment.com/docs/partners/faqs/#does-segment-de-dupe-messages
   */
  messageId?: string | undefined
} & IdentityOptions

export type FlushParams = {
  /**
   * Max time in milliseconds to wait until the resulting promise resolves.
   */
  timeout?: number | undefined
  /**
   * If true, will prevent new events from entering the pipeline. Default: false
   */
  close?: boolean | undefined
}

export type CloseAndFlushParams = {
  /**
   * Max time in milliseconds to wait until the resulting promise resolves.
   */
  timeout?: FlushParams['timeout'] | undefined
}
