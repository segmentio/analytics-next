import uuid from '@lukeed/uuid'
import { ID, User } from '../user'
import { CompactMetric } from '../stats'
export type Integrations = Record<string, boolean>

export type Options = {
  integrations?: Integrations
  [key: string]: any
}

interface AnalyticsContext {
  page?: object
  metrics?: CompactMetric[]
  [key: string]: any
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
