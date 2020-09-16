export interface SegmentEvent {
  messageId?: string

  type: 'track' | 'page' | 'identify' | 'group' | 'system'

  properties?: object
  traits?: object
  context?: object
  options?: object

  userId?: string
  anonymousId?: string
  event?: string
}
