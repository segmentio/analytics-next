import { CoreContext } from '../context'
import { ID } from '../user'

export type Callback<Ctx extends CoreContext = CoreContext> = (
  ctx: Ctx
) => Promise<unknown> | unknown

export type SegmentEventType =
  | 'track'
  | 'page'
  | 'identify'
  | 'group'
  | 'alias'
  | 'screen'

export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { [member: string]: JSONValue }
export type JSONArray = JSONValue[]

export type EventProperties = Record<string, any>

export type Integrations = {
  All?: boolean
  [integration: string]: boolean | JSONObject | undefined
}

// renamed
export interface CoreOptions {
  integrations?: Integrations
  timestamp?: Timestamp
  context?: CoreExtraContext
  anonymousId?: string
  userId?: string
  traits?: CoreAnalyticsTraits
  // ugh, this is ugly, but we allow literally any property to be passed to options (which get spread onto the event)
  // we may want to remove this...
  [key: string]: any
}

/**
 * Context is a dictionary of extra information that provides useful context about a datapoint, for example the user’s ip address or locale. You should only use Context fields for their intended meaning.
 * @link https://segment.com/docs/connections/spec/common/#context
 */
export interface CoreExtraContext {
  /**
   * This is usually used to flag an .identify() call to just update the trait, rather than "last seen".
   */
  active?: boolean

  /**
   * Current user's IP address.
   */
  ip?: string

  /**
   * Locale string for the current user, for example en-US.
   * @example en-US
   */
  locale?: string
  /**
   * Dictionary of information about the user’s current location.
   */
  location?: {
    /**
     * @example San Francisco
     */
    city?: string
    /**
     * @example United States
     */
    country?: string
    /**
     * @example 40.2964197
     */
    latitude?: string
    /**
     * @example -76.9411617
     */
    longitude?: string
    /**
     * @example CA
     */
    region?: string
    /**
     * @example 100
     */
    speed?: number
  }

  /**
   * Dictionary of information about the current web page.
   */
  page?: {
    /**
     * @example /academy/
     */
    path?: string
    /**
     * @example https://www.foo.com/
     */
    referrer?: string
    /**
     * @example projectId=123
     */
    search?: string
    /**
     * @example Analytics Academy
     */
    title?: string
    /**
     * @example https://segment.com/academy/
     */
    url?: string
  }

  /**
   * User agent of the device making the request.
   */
  userAgent?: string

  /**
   * Information about the current library.
   *
   * **Automatically filled out by the library.**
   *
   * This type should probably be "never"
   */
  library?: {
    /**
     * @example analytics-node-next/latest
     */
    name: string
    /**
     * @example  "1.43.1"
     */
    version: string
  }

  /**
   * This is useful in cases where you need to track an event,
   * but also associate information from a previous identify call.
   * You should fill this object the same way you would fill traits in an identify call.
   */
  traits?: CoreAnalyticsTraits

  /**
   * Dictionary of information about the campaign that resulted in the API call, containing name, source, medium, term, content, and any other custom UTM parameter.
   */
  campaign?: {
    name: string
    term: string
    source: string
    medium: string
    content: string
  }

  /**
   * Dictionary of information about the way the user was referred to the website or app.
   */
  referrer?: {
    type?: string
    name?: string
    url?: string
    link?: string

    id?: string // undocumented
    btid?: string // undocumented?
    urid?: string // undocumented?
  }

  amp?: {
    // undocumented?
    id: string
  }

  [key: string]: any
}

export interface CoreSegmentEvent {
  messageId?: string
  type: SegmentEventType

  // page specific
  category?: string
  name?: string

  properties?: EventProperties

  traits?: CoreAnalyticsTraits // Traits is only defined in 'identify' and 'group', even if it can be passed in other calls.

  integrations?: Integrations
  context?: CoreExtraContext
  options?: CoreOptions

  userId?: ID
  anonymousId?: ID
  groupId?: ID
  previousId?: ID

  event?: string

  writeKey?: string

  sentAt?: Date

  _metadata?: SegmentEventMetadata

  timestamp?: Timestamp
}

export interface SegmentEventMetadata {
  failedInitializations?: unknown[]
  bundled?: string[]
  unbundled?: string[]
  nodeVersion?: string
  bundledConfigIds?: string[]
  unbundledConfigIds?: string[]
  bundledIds?: string[]
}

export type Timestamp = Date | string

/**
 * A Plan allows users to specify events and which destinations they would like them to be sent to
 */
export interface Plan {
  track?: TrackPlan
  identify?: TrackPlan
  group?: TrackPlan
}

export interface TrackPlan {
  [key: string]: PlanEvent | undefined
  // __default SHOULD always exist, but marking as optional for extra safety.
  __default?: PlanEvent
}

export interface PlanEvent {
  /**
   * Whether or not this plan event is enabled
   */
  enabled: boolean
  /**
   * Which integrations the plan event applies to
   */
  integrations?: {
    [key: string]: boolean
  }
}

/**
 * Traits are pieces of information you know about a user.
 * This interface represents reserved traits that Segment has standardized.
 * @link https://segment.com/docs/connections/spec/identify/#traits
 * @link https://segment.com/docs/connections/spec/group/#traits
 */
export interface CoreAnalyticsTraits {
  /**
   * Unique ID in your database for a user/group.
   */
  id?: string

  /**
   * Industry a user works in, or a group is part of.
   */
  industry?: string

  /**
   * First name of a user.
   */
  firstName?: string

  /**
   * Last name of a user.
   */
  lastName?: string

  /**
   * Full name of a user/group. If you only pass a first and last name Segment automatically fills in the full name for you.
   */
  name?: string

  /**
   * Phone number of a user/group.
   */
  phone?: string

  /**
   * Title of a user, usually related to their position at a specific company.
   * @example VP of Engineering
   */
  title?: string

  /**
   * User’s username. This should be unique to each user, like the usernames of Twitter or GitHub.
   */
  username?: string

  /**
   * Website of a user/group.
   */
  website?: string

  /**
   * Street address of a user/group.
   */
  address?: {
    city?: string
    country?: string
    postalCode?: string
    state?: string
    street?: string
  }

  /**
   * Age of a user.
   */
  age?: number

  /**
   * URL to an avatar image for the user/group.
   */
  avatar?: string

  /**
   * User's birthday.
   */
  birthday?: Timestamp

  /**
   * User's company.
   */
  company?: {
    name?: string
    id?: string | number
    industry?: CoreAnalyticsTraits['industry']
    employee_count?: CoreAnalyticsTraits['employees']
    plan?: CoreAnalyticsTraits['plan']
  }

  /**
   * Number of employees of a group, typically used for companies.
   */
  employees?: number

  /**
    Plan that a user/group is in.

   * @example enterprise
   */
  plan?: string

  /**
   * 	Date the user/group's account was first created. Segment recommends using ISO-8601 date strings.
   */
  createdAt?: Timestamp

  /**
   * Description of user/group, such as bio.
   */
  description?: string

  /**
   * Email address of a user/group.
   */
  email?: string

  /**
   * @example female
   */
  gender?: string

  [customTrait: string]: any
}
