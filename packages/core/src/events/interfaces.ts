import { CoreContext } from '../context'
import { ID } from '../user'

export type Callback = (ctx: CoreContext) => Promise<unknown> | unknown

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

export type Traits = Record<string, any>

export type EventProperties = Record<string, any>

export type Integrations = {
  All?: boolean
  [integration: string]: boolean | JSONObject | undefined
}

// renamed
export interface CoreOptions {
  integrations?: Integrations
  timestamp?: Date | string
  context?: CoreAnalyticsContext
  anonymousId?: string
  traits?: Traits

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface CoreAnalyticsContext {
  page?: {
    /**
     *  {@link https://github.com/segmentio/analytics.js-integrations/blob/2d5c637c022d2661c23449aed237d0d546bf062d/integrations/segmentio/lib/index.js#L151}
     */
    path?: string
    referrer?: string
    search?: string
    title?: string
    url?: string
  }

  /**
   *  {@link https://github.com/segmentio/analytics.js-integrations/blob/2d5c637c022d2661c23449aed237d0d546bf062d/integrations/segmentio/lib/index.js#L285}
   */
  userAgent?: string

  /**
   * {@link https://github.com/segmentio/analytics.js-integrations/blob/2d5c637c022d2661c23449aed237d0d546bf062d/integrations/segmentio/lib/index.js#L286-L289}
   */
  locale?: string

  /**
   * {@link https://github.com/segmentio/analytics.js-integrations/blob/2d5c637c022d2661c23449aed237d0d546bf062d/integrations/segmentio/lib/index.js#L290-L291}
   */
  library?: {
    name: string
    version: string
  }

  /**
   * {@link https://github.com/segmentio/analytics.js-integrations/blob/2d5c637c022d2661c23449aed237d0d546bf062d/integrations/segmentio/lib/index.js#L292-L301}
   */
  traits?: {
    crossDomainId?: string
  }

  /**
   * utm params
   * {@link https://github.com/segmentio/analytics.js-integrations/blob/2d5c637c022d2661c23449aed237d0d546bf062d/integrations/segmentio/lib/index.js#L303-L305}
   * {@link https://github.com/segmentio/utm-params/blob/master/lib/index.js#L49}
   */
  campaign?: {
    /**
     * This can also come from the "utm_campaign" param
     *
     * {@link https://github.com/segmentio/utm-params/blob/master/lib/index.js#L40}
     */
    name: string
    term: string
    source: string
    medium: string
    content: string
  }

  /**
   *  {@link https://github.com/segmentio/analytics.js-integrations/blob/2d5c637c022d2661c23449aed237d0d546bf062d/integrations/segmentio/lib/index.js#L415}
   */
  referrer?: {
    btid?: string
    urid?: string
  }

  /**
   * {@link https://github.com/segmentio/analytics.js-integrations/blob/2d5c637c022d2661c23449aed237d0d546bf062d/integrations/segmentio/lib/index.js#L322}
   */
  amp?: {
    id: string
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface CoreSegmentEvent {
  messageId?: string
  type: SegmentEventType

  // page specific
  category?: string
  name?: string

  properties?: EventProperties

  traits?: Traits

  integrations?: Integrations
  context?: CoreAnalyticsContext | CoreOptions
  options?: CoreOptions

  userId?: ID
  anonymousId?: ID
  groupId?: ID
  previousId?: ID

  event?: string

  writeKey?: string

  sentAt?: Date

  _metadata?: SegmentEventMetadata

  timestamp?: Date | string
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

export type SegmentEventTimestamp = Date | string

export interface Plan {
  track?: TrackPlan
}

export interface TrackPlan {
  [key: string]: PlanEvent | undefined
  // __default SHOULD always exist, but marking as optional for extra safety.
  __default?: PlanEvent
}

interface PlanEvent {
  /**
   * Whether or not this plan event is enabled
   */
  enabled: boolean
  /**
   * Which integrations the plan event applies to
   */
  integrations: {
    [key: string]: boolean
  }
}

export interface ReservedTraits {
  address: Partial<{
    city: string
    country: string
    postalCode: string
    state: string
    street: string
  }>
  age: number
  avatar: string
  birthday: Date
  company: Partial<{
    name: string
    id: string | number
    industry: string
    employee_count: number
  }>
  plan: string
  createdAt: Date
  description: string
  email: string
  firstName: string
  gender: string
  id: string
  lastName: string
  name: string
  phone: string
  title: string
  username: string
  website: string
}
