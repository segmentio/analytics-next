import { sendEventsToCollect } from '../send-events'
import type { AnalyticsEventEnvelope } from '../types'

const sampleEvent = (): AnalyticsEventEnvelope => ({
  type: 'track',
  event_name: 'test',
  anonymous_id: '550e8400-e29b-41d4-a716-446655440001',
  context: {},
  message_id: '550e8400-e29b-41d4-a716-446655440002',
  original_timestamp: '2026-03-23T12:00:00.000Z',
  timestamp: '2026-03-23T12:00:00.000Z',
  version: 2,
})

describe('sendEventsToCollect', () => {
  it('retries failed requests with backoff', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
    global.fetch = fetchMock

    await sendEventsToCollect([sampleEvent()], {
      endpoint: '/collector',
      retryAttempts: 1,
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(body.events[0].sent_at).toBeDefined()
  })
})
