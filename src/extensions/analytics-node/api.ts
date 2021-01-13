import fetch from 'node-fetch'
import { SegmentEvent } from '../../core/events'

export async function postToTrackingAPI(
  event: SegmentEvent,
  writeKey: string
): Promise<SegmentEvent> {
  await fetch('https://api.segment.io/v1/batch', {
    method: 'POST',
    headers: {
      'user-agent': 'analytics-node-next/latest',
      authorization: `Basic ${btoa(writeKey)}`,
    },
    body: JSON.stringify(event),
  })

  return event
}
