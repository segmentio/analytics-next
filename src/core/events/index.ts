import { ID, User } from '../user'

interface AnalyticsContext {
  page?: object
}

export interface SegmentEvent {
  messageId?: string

  type: 'track' | 'page' | 'identify' | 'group'

  properties?: object
  traits?: object
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
    return {
      event,
      type: 'track' as const,
      properties,
      userId: this.user.id(),
      anonymousId: this.user.anonymousId(),
      options,
    }
  }

  page(_name: string, properties?: object, options?: object): SegmentEvent {
    return {
      event: 'page',
      type: 'page' as const,
      properties,
      userId: this.user.id(),
      anonymousId: this.user.anonymousId(),
      options,
    }
  }

  identify(userId: ID, traits?: object, options?: object): SegmentEvent {
    return {
      type: 'identify' as const,
      userId,
      traits,
      anonymousId: this.user.anonymousId(),
      options,
    }
  }
}
