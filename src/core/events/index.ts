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

export function eventFactory(user: User) {
  function track(event: string, properties: object): SegmentEvent {
    return {
      event,
      type: 'track' as const,
      properties,
      userId: user.id(),
      anonymousId: user.anonymousId(),
    }
  }

  function identify(userId: ID, traits: object): SegmentEvent {
    return {
      type: 'identify' as const,
      userId,
      traits,
      anonymousId: user.anonymousId(),
    }
  }

  return {
    track,
    identify,
  }
}
