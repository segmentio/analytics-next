import { ID, User } from '../user'

export interface SegmentEvent {
  messageId?: string

  type: 'track' | 'page' | 'identify' | 'group'

  properties?: object
  traits?: object
  context?: object
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

  track(event: string, properties: object): SegmentEvent {
    return {
      event,
      type: 'track' as const,
      properties,
      userId: this.user.id(),
      anonymousId: this.user.anonymousId(),
    }
  }

  identify(userId: ID, traits: object): SegmentEvent {
    return {
      type: 'identify' as const,
      userId,
      traits,
      anonymousId: this.user.anonymousId(),
    }
  }
}
