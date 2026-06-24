import {
  buildCollectRequestBody,
  deliverCollectPayload,
  sendCollectViaBeacon,
  sendEventsToCollect,
} from '../send-events'
import type { CollectEvent } from '../types'

const sampleEvent = (): CollectEvent => ({
  type: 'track',
  event: 'test',
  anonymousId: '550e8400-e29b-41d4-a716-446655440001',
  context: {},
  messageId: '550e8400-e29b-41d4-a716-446655440002',
  originalTimestamp: '2026-03-23T12:00:00.000Z',
  timestamp: '2026-03-23T12:00:00.000Z',
})

describe('sendEventsToCollect', () => {
  it('retries failed requests with backoff', async () => {
    const warnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)
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
    const body = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1]?.body)
    ) as CollectEvent[]
    expect(Array.isArray(body)).toBe(true)
    expect(body[0]?.sentAt).toBeDefined()
    expect(body[0]?._metadata?.retryCount).toBe(0)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
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

  it('respects x-ratelimit-reset delay in seconds on 429', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'x-ratelimit-reset': '1' }),
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

  it('builds native array payload with retry metadata', () => {
    const body = buildCollectRequestBody([{ ...sampleEvent(), _retryCount: 2 }])
    const parsed = JSON.parse(body) as CollectEvent[]
    expect(parsed).toHaveLength(1)
    expect(parsed[0]?._metadata?.retryCount).toBe(2)
  })
})

describe('sendCollectViaBeacon', () => {
  it('returns false when sendBeacon is unavailable', () => {
    const original = navigator.sendBeacon
    Object.defineProperty(navigator, 'sendBeacon', {
      value: undefined,
      configurable: true,
    })
    expect(sendCollectViaBeacon('/collector', '[]')).toBe(false)
    Object.defineProperty(navigator, 'sendBeacon', {
      value: original,
      configurable: true,
    })
  })

  it('returns true when sendBeacon succeeds with small payload', () => {
    const sendBeaconMock = jest.fn(() => true)
    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconMock,
      configurable: true,
    })
    const body = JSON.stringify([sampleEvent()])
    const result = sendCollectViaBeacon('/collector', body)
    expect(result).toBe(true)
    expect(sendBeaconMock).toHaveBeenCalledWith('/collector', expect.any(Blob))
    jest.restoreAllMocks()
  })

  it('returns false when payload exceeds 64KB beacon limit', () => {
    const sendBeaconMock = jest.fn(() => true)
    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconMock,
      configurable: true,
    })
    const largeBody = '[' + 'x'.repeat(64 * 1024) + ']'
    const result = sendCollectViaBeacon('/collector', largeBody)
    expect(result).toBe(false)
    expect(sendBeaconMock).not.toHaveBeenCalled()
    jest.restoreAllMocks()
  })
})
