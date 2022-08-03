import { Context } from '../context'
import { CompactMetric } from '../stats'
import { ID } from '../user'

export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { [member: string]: JSONValue }
export type JSONArray = Array<JSONValue>

export type Callback = (ctx: Context) => Promise<unknown> | unknown

export type Integrations = {
  All?: boolean
  [integration: string]: boolean | JSONObject | undefined
}

export type Options = {
  integrations?: Integrations
  anonymousId?: ID
  timestamp?: Date | string
  context?: AnalyticsContext
  traits?: Traits

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface AnalyticsContext {
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
  metrics?: CompactMetric[]

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

export type Traits = { [k: string]: JSONValue }
export type EventProperties = {
  [k: string]: JSONValue
}

export interface SegmentEvent {
  messageId?: string

  type: 'track' | 'page' | 'identify' | 'group' | 'alias' | 'screen'

  // page specific
  category?: string
  name?: string

  properties?: EventProperties

  traits?: Traits

  integrations?: Integrations
  context?: AnalyticsContext | Options
  options?: Options

  userId?: ID
  anonymousId?: ID
  groupId?: ID
  previousId?: ID

  event?: string

  /**
   * {@link https://github.com/segmentio/analytics.js-integrations/blob/2d5c637c022d2661c23449aed237d0d546bf062d/integrations/segmentio/lib/index.js#L284}
   */
  writeKey?: string

  /**
   *  {@link https://github.com/segmentio/analytics.js-integrations/blob/2d5c637c022d2661c23449aed237d0d546bf062d/integrations/segmentio/lib/index.js#L151}
   */
  sentAt?: Date

  /**
   * {@link https://github.com/segmentio/analytics.js-integrations/blob/2d5c637c022d2661c23449aed237d0d546bf062d/integrations/segmentio/lib/index.js#L311-L320}
   */
  _metadata?: {
    failedInitializations?: unknown[]
    bundled?: string[]
    unbundled?: string[]
    nodeVersion?: string
    bundledConfigIds?: string[]
    unbundledConfigIds?: string[]
    bundledIds?: string[]
  }

  timestamp?: Date | string
}

/**
 * A Plan allows users to specify events and which destinations they would like them to be sent to
 */
export interface Plan {
  track?: TrackPlan
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
