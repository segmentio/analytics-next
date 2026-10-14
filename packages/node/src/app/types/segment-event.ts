import type { CoreSegmentEvent } from '@segment/analytics-core'

type SegmentEventType =
  | 'track'
  | 'page'
  | 'identify'
  | 'alias'
  | 'screen'
  | 'group'

export interface SegmentEvent extends CoreSegmentEvent {
  type: SegmentEventType
}
