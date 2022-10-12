import { SegmentEvent } from '../core/events'

export const klona = (evt: SegmentEvent): SegmentEvent =>
  JSON.parse(JSON.stringify(evt))
