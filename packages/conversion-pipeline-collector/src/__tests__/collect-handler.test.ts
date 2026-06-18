import { handleCollectRequest } from '../collect-handler'

describe('handleCollectRequest', () => {
  it('returns 202 with queued count for valid native batch', () => {
    const result = handleCollectRequest([
      {
        type: 'track',
        event: 'impression',
        anonymousId: '550e8400-e29b-41d4-a716-446655440001',
        messageId: '550e8400-e29b-41d4-a716-446655440002',
        timestamp: '2026-06-08T12:00:00.000Z',
        properties: { block_id: 'x' },
        context: { sessionId: '660e8400-e29b-41d4-a716-446655440000' },
      },
      {
        type: 'page',
        anonymousId: '550e8400-e29b-41d4-a716-446655440001',
        messageId: '550e8400-e29b-41d4-a716-446655440005',
        timestamp: '2026-06-08T12:00:00.000Z',
        context: { sessionId: '660e8400-e29b-41d4-a716-446655440000' },
      },
    ])

    expect(result.status).toBe(202)
    expect(result.body).toEqual({ ok: true, queued: 2 })
    expect(result.events).toHaveLength(2)
  })

  it('returns 400 for invalid body', () => {
    const result = handleCollectRequest({ invalid: true })
    expect(result.status).toBe(400)
    expect(result.body.ok).toBe(false)
  })

  it('returns 422 for invalid session id', () => {
    const result = handleCollectRequest([
      {
        type: 'track',
        event: 'page',
        anonymousId: '550e8400-e29b-41d4-a716-446655440001',
        messageId: '550e8400-e29b-41d4-a716-446655440002',
        timestamp: '2026-06-08T12:00:00.000Z',
        context: { sessionId: 'not-a-uuid' },
      },
    ])
    expect(result.status).toBe(422)
    expect(result.body).toMatchObject({ ok: false, error: 'invalid_session_id' })
  })
})
