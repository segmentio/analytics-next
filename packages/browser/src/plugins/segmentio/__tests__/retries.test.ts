const fetch = jest.fn()
jest.mock('unfetch', () => {
  return fetch
})

import { segmentio, SegmentioSettings } from '..'
import { Analytics } from '../../../core/analytics'
// @ts-ignore isOffline mocked dependency is accused as unused
import { isOffline } from '../../../core/connection'
import { Plugin } from '../../../core/plugin'
import { envEnrichment } from '../../env-enrichment'
import { scheduleFlush } from '../schedule-flush'
import * as PPQ from '../../../lib/priority-queue/persisted'
import * as PQ from '../../../lib/priority-queue'
import { Context } from '../../../core/context'
import { createError, createSuccess } from '../../../test-helpers/factories'

jest.mock('../schedule-flush')

type QueueType = 'priority' | 'persisted'

describe('Segment.io retries 500s and 429', () => {
  let options: SegmentioSettings
  let analytics: Analytics
  let segment: Plugin
  beforeEach(async () => {
    jest.resetAllMocks()
    jest.restoreAllMocks()

    options = { apiKey: 'foo' }
    analytics = new Analytics(
      { writeKey: options.apiKey },
      {
        retryQueue: true,
      }
    )
    segment = await segmentio(analytics, options, {})
    await analytics.register(segment, envEnrichment)
  })

  test('retries on 500', async () => {
    fetch.mockImplementation(() => createError({ status: 500 }))

    const ctx = await analytics.track('event')

    expect(ctx.attempts).toBe(1)
    expect(analytics.queue.queue.getAttempts(ctx)).toBe(1)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(scheduleFlush).toHaveBeenCalled()
  })

  test('delays retry on 429', async () => {
    const headers = new Headers()
    const resetTime = 1
    headers.set('x-ratelimit-reset', resetTime.toString())
    fetch
      .mockReturnValueOnce(
        createError({
          status: 429,
          statusText: 'Too Many Requests',
          headers: headers,
        })
      )
      .mockReturnValue(createSuccess({}))

    const ctx = await analytics.track('event')
    expect(ctx.attempts).toBe(1)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(scheduleFlush).toHaveBeenCalled()
  })
})

describe('Batches retry 500s and 429', () => {
  let options: SegmentioSettings
  let analytics: Analytics
  let segment: Plugin
  beforeEach(async () => {
    jest.resetAllMocks()
    jest.restoreAllMocks()

    options = {
      apiKey: 'foo',
      deliveryStrategy: {
        strategy: 'batching',
        // timeout is set very low to get consistent behavior out of scheduleflush
        config: { size: 3, timeout: 1, retryAttempts: 3 },
      },
    }
    analytics = new Analytics(
      { writeKey: options.apiKey },
      {
        retryQueue: true,
      }
    )
    segment = await segmentio(analytics, options, {})
    await analytics.register(segment, envEnrichment)
  })

  test('retries on 500', async () => {
    fetch
      .mockReturnValueOnce(() => createError({ status: 500 }))
      .mockReturnValue(createSuccess({}))

    const ctx1 = await analytics.track('event1')
    const ctx2 = await analytics.track('event2')
    // wait a bit for retries - timeout is only 1 ms
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(ctx1.attempts).toBe(1)
    expect(analytics.queue.queue.getAttempts(ctx1)).toBe(1)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  test('delays retry on 429', async () => {
    const headers = new Headers()
    const resetTime = 1
    headers.set('x-ratelimit-reset', resetTime.toString())
    fetch.mockReturnValue(
      createError({
        status: 429,
        statusText: 'Too Many Requests',
        headers: headers,
      })
    )

    const ctx1 = await analytics.track('event1')
    const ctx2 = await analytics.track('event2')

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(ctx1.attempts).toBe(1)
    expect(fetch).toHaveBeenCalledTimes(1)

    expect(fetch).toHaveBeenCalledTimes(1)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(fetch).toHaveBeenCalledTimes(2)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(fetch).toHaveBeenCalledTimes(3)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(fetch).toHaveBeenCalledTimes(3) // capped at 3 retries
  })
})

describe('Segment.io retries', () => {
  let options: SegmentioSettings
  let analytics: Analytics
  let segment: Plugin
  let queue: (PPQ.PersistedPriorityQueue | PQ.PriorityQueue<Context>) & {
    __type?: QueueType
  }
  ;[false, true].forEach((persistenceIsDisabled) => {
    describe(`disableClientPersistence: ${persistenceIsDisabled}`, () => {
      beforeEach(async () => {
        jest.resetAllMocks()
        jest.restoreAllMocks()

        // @ts-expect-error reassign import
        isOffline = jest.fn().mockImplementation(() => true)

        options = { apiKey: 'foo' }
        analytics = new Analytics(
          { writeKey: options.apiKey },
          {
            retryQueue: true,
            disableClientPersistence: persistenceIsDisabled,
          }
        )

        if (persistenceIsDisabled) {
          queue = new PQ.PriorityQueue(3, [])
          queue['__type'] = 'priority'
          Object.defineProperty(PQ, 'PriorityQueue', {
            writable: true,
            value: jest.fn().mockImplementation(() => queue),
          })
        } else {
          queue = new PPQ.PersistedPriorityQueue(
            3,
            `${options.apiKey}:test-Segment.io`
          )
          queue['__type'] = 'persisted'
          Object.defineProperty(PPQ, 'PersistedPriorityQueue', {
            writable: true,
            value: jest.fn().mockImplementation(() => queue),
          })
        }

        segment = await segmentio(analytics, options, {})

        await analytics.register(segment, envEnrichment)
      })

      test(`add events to the queue`, async () => {
        jest.spyOn(queue, 'push')

        const ctx = await analytics.track('event')

        expect(scheduleFlush).toHaveBeenCalled()
        /* eslint-disable  @typescript-eslint/unbound-method */
        expect(queue.push).toHaveBeenCalled()
        expect(queue.length).toBe(1)
        expect(ctx.attempts).toBe(1)
        expect(isOffline).toHaveBeenCalledTimes(2)
        expect(queue.__type).toBe<QueueType>(
          persistenceIsDisabled ? 'priority' : 'persisted'
        )
      })
    })
  })
})
