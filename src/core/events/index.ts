import uuid from '@lukeed/uuid'
import { ID, User } from '../user'
import { CompactMetric } from '../stats'

export type Integrations = Record<string, boolean>

export type Options = {
  integrations?: Integrations
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

  [key: string]: any

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
    name: 'ajs-next'
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
}

export interface SegmentEvent {
  messageId?: string

  type: 'track' | 'page' | 'identify' | 'group' | 'alias'

  properties?: object
  // TODO: Narrow types (i.e. only show traits for `track` and `group`)
  traits?: object

  integrations?: Record<string, boolean>
  context?: AnalyticsContext
  options?: Options

  userId?: ID
  anonymousId?: ID

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
    bundled: string[]
    unbundledIntegrations: string[]
  }
}

export class EventFactory {
  user: User

  constructor(user: User) {
    this.user = user
  }

  track(event: string, properties?: object, options?: Options, integrations?: Integrations): SegmentEvent {
    return this.normalize({
      ...this.baseEvent(),
      event,
      type: 'track' as const,
      properties,
      options,
      integrations,
    })
  }

  // TODO: verify this
  page(_name: string | null, properties?: object, options?: Options, integrations?: Integrations): SegmentEvent {
    return this.normalize({
      ...this.baseEvent(),
      event: 'page',
      type: 'page' as const,
      properties,
      options,
      integrations,
    })
  }

  identify(userId: ID, traits?: object, options?: Options, integrations?: Integrations): SegmentEvent {
    return this.normalize({
      ...this.baseEvent(),
      type: 'identify' as const,
      userId,
      traits,
      options,
      integrations,
    })
  }

  group(userId: ID, traits?: object, options?: Options, integrations?: Integrations): SegmentEvent {
    return this.normalize({
      ...this.baseEvent(),
      type: 'group' as const,
      userId,
      traits,
      options,
      integrations,
    })
  }

  private baseEvent(): Partial<SegmentEvent> {
    const base: Partial<SegmentEvent> = {
      properties: {},
      integrations: {},
      options: {},
    }

    if (this.user.id()) {
      base.userId = this.user.id()
    } else {
      base.anonymousId = this.user.anonymousId()
    }

    return base
  }

  private normalize(event: SegmentEvent): SegmentEvent {
    const allIntegrations = {
      // Base config integrations object
      ...event.integrations,
      // Per event overrides
      ...event.options?.integrations,
    }

    return {
      ...event,
      integrations: allIntegrations,
      messageId: 'ajs-next-' + uuid(),
    }
  }
}
