import { BatchBuffer } from '../batch-buffer'
import { EVENT_QUEUE_STORAGE_KEY } from '../lib/event-queue-storage'
import type { CollectEvent } from '../types'

const endpoint = 'https://collector.test/events'

const sampleEvent = (overrides: Partial<CollectEvent> = {}): CollectEvent => ({
  type: 'track',
  event: 'test_event',
  anonymousId: '550e8400-e29b-41d4-a716-446655440001',
  context: {},
  messageId: '550e8400-e29b-41d4-a716-446655440002',
  originalTimestamp: '2026-03-23T12:00:00.000Z',
  timestamp: '2026-03-23T12:00:00.000Z',
  ...overrides,
})

function createBuffer(): BatchBuffer {
  return new BatchBuffer({
    endpoint,
    retryAttempts: 0,
    flushIntervalMs: 60_000,
    batchSize: 10,
  })
}

describe('BatchBuffer resilient transport', () => {
  beforeEach(() => {
    window.localStorage.clear()
    jest.restoreAllMocks()
  })

  it('persists offline queue across a new buffer instance', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'))

    const first = createBuffer()
    first.enqueue(sampleEvent())

    await expect(first.flush()).rejects.toMatchObject({ retryable: true })
    expect(window.localStorage.getItem(EVENT_QUEUE_STORAGE_KEY)).toContain(
      'test_event'
    )

    const second = createBuffer()
    expect(second.getSize()).toBe(1)
  })

  it('treats successful sendBeacon on unload as delivered', async () => {
    const fetchMock = jest.fn()
    global.fetch = fetchMock
    const beaconMock = jest.fn(() => true)
    Object.defineProperty(navigator, 'sendBeacon', {
      value: beaconMock,
      configurable: true,
    })

    const buffer = createBuffer()
    buffer.enqueue(sampleEvent())

    await buffer.flushAll({ unload: true })

    expect(beaconMock).toHaveBeenCalledWith(endpoint, expect.any(Blob))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(buffer.getSize()).toBe(0)
    expect(window.localStorage.getItem(EVENT_QUEUE_STORAGE_KEY)).toBeNull()
  })

  it('falls back to keepalive fetch when unload payload is over the beacon limit', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
    })
    global.fetch = fetchMock
    const beaconMock = jest.fn(() => true)
    Object.defineProperty(navigator, 'sendBeacon', {
      value: beaconMock,
      configurable: true,
    })

    const buffer = createBuffer()
    buffer.enqueue(
      sampleEvent({ properties: { payload: 'x'.repeat(70 * 1024) } })
    )

    await buffer.flushAll({ unload: true })

    expect(beaconMock).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({ keepalive: true })
    )
    expect(buffer.getSize()).toBe(0)
  })
})
