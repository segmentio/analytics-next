import type { AnalyticsEventEnvelope } from '../../types'
import {
  clearPersistedEventQueue,
  EVENT_QUEUE_STORAGE_KEY,
  MAX_PERSISTED_EVENTS,
  readPersistedEventQueue,
  writePersistedEventQueue,
} from '../event-queue-storage'

const sampleEvent = (id: string): AnalyticsEventEnvelope => ({
  type: 'track',
  event_name: 'test',
  anonymous_id: '550e8400-e29b-41d4-a716-446655440001',
  context: {},
  message_id: id,
  original_timestamp: '2026-03-23T12:00:00.000Z',
  timestamp: '2026-03-23T12:00:00.000Z',
  version: 2,
})

describe('event-queue-storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    clearPersistedEventQueue()
  })

  it('returns an empty queue when storage is empty', () => {
    expect(readPersistedEventQueue()).toEqual([])
  })

  it('persists and reads events', () => {
    const events = [sampleEvent('1'), sampleEvent('2')]
    writePersistedEventQueue(events)
    expect(readPersistedEventQueue()).toEqual(events)
  })

  it('clears storage when queue is empty', () => {
    writePersistedEventQueue([sampleEvent('1')])
    writePersistedEventQueue([])
    expect(window.localStorage.getItem(EVENT_QUEUE_STORAGE_KEY)).toBeNull()
    expect(readPersistedEventQueue()).toEqual([])
  })

  it('keeps only the most recent events when over the max count', () => {
    const events = Array.from(
      { length: MAX_PERSISTED_EVENTS + 5 },
      (_, index) => sampleEvent(String(index))
    )
    writePersistedEventQueue(events)
    const persisted = readPersistedEventQueue()
    expect(persisted).toHaveLength(MAX_PERSISTED_EVENTS)
    expect(persisted[0]?.message_id).toBe('5')
    expect(persisted[persisted.length - 1]?.message_id).toBe(
      String(MAX_PERSISTED_EVENTS + 4)
    )
  })

  it('ignores invalid persisted payloads', () => {
    window.localStorage.setItem(
      EVENT_QUEUE_STORAGE_KEY,
      JSON.stringify([{ type: 'bad' }])
    )
    expect(readPersistedEventQueue()).toEqual([])
  })
})
