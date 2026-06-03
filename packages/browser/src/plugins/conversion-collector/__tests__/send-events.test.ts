import {
  buildCollectRequestBody,
  CollectDeliveryError,
  deliverCollectPayload,
  sendCollectViaBeacon,
  sendEventsToCollect,
} from '../send-events'
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
      .mockResolvedValueOnce({ ok: false, status: 500, headers: new Headers() })
      .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers() })
    global.fetch = fetchMock

    await sendEventsToCollect([sampleEvent()], {
      endpoint: '/collector',
      retryAttempts: 1,
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(body.events[0].sent_at).toBeDefined()
  })

  it('does not retry permanent 4xx errors', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers(),
    })
    global.fetch = fetchMock

    await expect(
      sendEventsToCollect([sampleEvent()], {
        endpoint: '/collector',
        retryAttempts: 2,
      })
    ).rejects.toMatchObject({ retryable: false })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('respects Retry-After on 429', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '0' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
      })
    global.fetch = fetchMock

    await sendEventsToCollect([sampleEvent()], {
      endpoint: '/collector',
      retryAttempts: 1,
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('uses keepalive on deliverCollectPayload when requested', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
    })
    global.fetch = fetchMock

    const body = buildCollectRequestBody([sampleEvent()])
    await deliverCollectPayload(
      body,
      { endpoint: '/collector' },
      { keepalive: true }
    )

    expect(fetchMock.mock.calls[0]?.[1]?.keepalive).toBe(true)
  })
})

describe('sendCollectViaBeacon', () => {
  it('returns false when sendBeacon is unavailable', () => {
    const original = navigator.sendBeacon
    Object.defineProperty(navigator, 'sendBeacon', {
      value: undefined,
      configurable: true,
    })
    expect(sendCollectViaBeacon('/collector', '{}')).toBe(false)
    Object.defineProperty(navigator, 'sendBeacon', {
      value: original,
      configurable: true,
    })
  })
})
