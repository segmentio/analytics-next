import { parseCollectBody, CollectBodyError } from '../parse-body'

const nativeTrack = {
  type: 'track',
  event: 'impression',
  anonymousId: '550e8400-e29b-41d4-a716-446655440001',
  messageId: '550e8400-e29b-41d4-a716-446655440002',
  timestamp: '2026-06-08T12:00:00.000Z',
  context: { sessionId: '660e8400-e29b-41d4-a716-446655440000' },
}

describe('parseCollectBody', () => {
  it('parses native analytics-next array', () => {
    const events = parseCollectBody([nativeTrack])
    expect(events).toHaveLength(1)
    expect(events[0]?.event).toBe('impression')
  })

  it('parses legacy envelope v2 wrapper', () => {
    const events = parseCollectBody({
      events: [
        {
          type: 'track',
          event_name: 'page',
          anonymous_id: '550e8400-e29b-41d4-a716-446655440001',
          message_id: '550e8400-e29b-41d4-a716-446655440003',
          timestamp: '2026-06-08T12:00:00.000Z',
          context: { session_id: '660e8400-e29b-41d4-a716-446655440000' },
          version: 2,
        },
      ],
    })
    expect(events[0]?.event).toBe('page')
    expect(events[0]?.anonymousId).toBe('550e8400-e29b-41d4-a716-446655440001')
  })

  it('rejects empty body', () => {
    expect(() => parseCollectBody([])).toThrow(CollectBodyError)
    expect(() => parseCollectBody({ events: [] })).toThrow(CollectBodyError)
  })

  it('rejects unknown shape', () => {
    expect(() => parseCollectBody({ foo: 'bar' })).toThrow(CollectBodyError)
  })
})
