import { CompactMetric } from '../stats'
import { ID } from '../user'

export type Integrations = {
  All?: boolean
  [integration: string]: boolean | undefined
}

export type Options = {
  integrations?: Integrations
  anonymousId?: ID
  timestamp?: Date | string
  context?: AnalyticsContext
  traits?: object

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
    crossDomainId: string
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

  [key: string]: any
}

export interface SegmentEvent {
  messageId?: string

  type: 'track' | 'page' | 'identify' | 'group' | 'alias' | 'screen'

  // page specific
  category?: string
  name?: string

  properties?: object

  // TODO: Narrow types (i.e. only show traits for `track` and `group`)
  traits?: object

  integrations?: Integrations
  context?: AnalyticsContext
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
    unbundledIntegrations?: string[]
    nodeVersion?: string
  }

  timestamp?: Date | string
}
