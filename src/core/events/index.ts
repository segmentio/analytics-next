import uuid from '@lukeed/uuid'
import { ID, User } from '../user'

interface AnalyticsContext {
  page?: object
}

export interface SegmentEvent {
  messageId?: string

  type: 'track' | 'page' | 'identify' | 'group' | 'alias'

  properties?: object
  traits?: object

  integrations?: Record<string, string>
  context?: AnalyticsContext
  options?: object

  userId?: ID
  anonymousId?: ID

  event?: string
}

export class EventFactory {
  user: User

  constructor(user: User) {
    this.user = user
  }

  track(event: string, properties?: object, options?: object): SegmentEvent {
    return this.normalize({
      ...this.baseEvent(),
      event,
      type: 'track' as const,
      properties,
      options,
    })
  }

  page(_name: string, properties?: object, options?: object): SegmentEvent {
    return this.normalize({
      ...this.baseEvent(),
      event: 'page',
      type: 'page' as const,
      properties,
      options,
    })
  }

  identify(userId: ID, traits?: object, options?: object): SegmentEvent {
    return this.normalize({
      ...this.baseEvent(),
      type: 'identify' as const,
      userId,
      traits,
      options,
    })
  }

  group(userId: ID, traits?: object, options?: object): SegmentEvent {
    return this.normalize({
      ...this.baseEvent(),
      type: 'group' as const,
      userId,
      traits,
      options,
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
    return {
      ...event,
      messageId: 'ajs-next-' + uuid(),
    }
  }
}
