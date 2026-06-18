import { sha256Hex } from '../hash-pii'
import { normalizeCollectEvent, NormalizeError } from '../normalize'

describe('normalizeCollectEvent', () => {
  it('normalizes native track with campaign attribution', () => {
    const flat = normalizeCollectEvent({
      type: 'track',
      event: 'impression',
      anonymousId: '550e8400-e29b-41d4-a716-446655440001',
      messageId: '550e8400-e29b-41d4-a716-446655440002',
      timestamp: '2026-06-08T12:00:00.000Z',
      sentAt: '2026-06-08T12:00:01.000Z',
      _metadata: { retryCount: 1 },
      properties: {
        block_id: 'top_father',
        block_position: 1,
      },
      context: {
        sessionId: '660e8400-e29b-41d4-a716-446655440000',
        campaign: { source: 'google', gclid: 'abc123' },
        page: {
          url: 'https://lp.example.com/usa-cc-p1',
          path: '/usa-cc-p1',
        },
      },
    })

    expect(flat.event_type).toBe('impression')
    expect(flat.session_id).toBe('660e8400-e29b-41d4-a716-446655440000')
    expect(flat.utm_source).toBe('google')
    expect(flat.gclid).toBe('abc123')
    expect(flat.block_id).toBe('top_father')
    expect(flat.retry_count).toBe(1)
    expect(flat.quality_flag).toBeNull()
  })

  it('hashes identify traits server-side', () => {
    const flat = normalizeCollectEvent({
      type: 'identify',
      anonymousId: '550e8400-e29b-41d4-a716-446655440001',
      userId: 'user-123',
      messageId: '550e8400-e29b-41d4-a716-446655440004',
      timestamp: '2026-06-08T12:00:00.000Z',
      traits: {
        email: 'User@Example.com',
        email_domain: 'example.com',
      },
      context: {
        sessionId: '660e8400-e29b-41d4-a716-446655440000',
      },
    })

    expect(flat.event_type).toBe('identify')
    expect(flat.user_id).toBe('user-123')
    expect(flat.email_hash).toBe(sha256Hex('User@Example.com'))
    expect(flat.email_domain).toBe('example.com')
  })

  it('marks incomplete ad-tech events', () => {
    const flat = normalizeCollectEvent({
      type: 'track',
      event: 'impression',
      anonymousId: '550e8400-e29b-41d4-a716-446655440001',
      messageId: '550e8400-e29b-41d4-a716-446655440002',
      timestamp: '2026-06-08T12:00:00.000Z',
      context: { sessionId: '660e8400-e29b-41d4-a716-446655440000' },
      properties: {},
    })
    expect(flat.quality_flag).toBe('incomplete')
  })

  it('rejects missing sessionId', () => {
    expect(() =>
      normalizeCollectEvent({
        type: 'track',
        event: 'page',
        anonymousId: '550e8400-e29b-41d4-a716-446655440001',
        messageId: '550e8400-e29b-41d4-a716-446655440002',
        timestamp: '2026-06-08T12:00:00.000Z',
        context: {},
      })
    ).toThrow(NormalizeError)
  })

  it('falls back to properties for legacy attribution fields', () => {
    const flat = normalizeCollectEvent({
      type: 'page',
      anonymousId: '550e8400-e29b-41d4-a716-446655440001',
      messageId: '550e8400-e29b-41d4-a716-446655440002',
      timestamp: '2026-06-08T12:00:00.000Z',
      properties: {
        utm_source: 'newsletter',
        gclid: 'legacy-gclid',
        query_params: { utm_medium: 'email' },
      },
      context: { sessionId: '660e8400-e29b-41d4-a716-446655440000' },
    })

    expect(flat.event_type).toBe('page')
    expect(flat.utm_source).toBe('newsletter')
    expect(flat.utm_medium).toBe('email')
    expect(flat.gclid).toBe('legacy-gclid')
  })
})
