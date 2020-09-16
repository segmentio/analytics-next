export interface SegmentEvent {
  messageId?: string

  type: 'track' | 'page' | 'identify' | 'group'

  properties?: object
  traits?: object
  context?: object
  options?: object

  userId?: string
  anonymousId?: string
  event?: string
}
