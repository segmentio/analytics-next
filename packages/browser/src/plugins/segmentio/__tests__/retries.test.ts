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
import unfetch from 'unfetch'

jest.mock('../schedule-flush')

type QueueType = 'priority' | 'persisted'

jest.mock('unfetch', () => {
  return jest.fn()
})

describe('Segment.io retries 500s and 429', () => {
  let options: SegmentioSettings
  let analytics: Analytics
  let segment: Plugin
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
      }
    )
    segment = await segmentio(analytics, options, {})

    await analytics.register(segment, envEnrichment)
  })

  test('retries on 500', async () => {
    const fetched = jest
      .mocked(unfetch)
      .mockImplementation(() => createError({ status: 500 }))

    const ctx = await analytics.track('event')

    expect(ctx.attempts).toBe(1)
    expect(analytics.queue.queue.getAttempts(ctx)).toBe(1)
    expect(fetched).toHaveBeenCalledTimes(2)
  })

  test('delays retry on 429', async () => {
    const headers = new Headers()
    const resetTime = 0.35
    headers.set('x-ratelimit-reset', resetTime.toString())
    const fetched = jest
      .mocked(unfetch)
      .mockReturnValueOnce(
        createError({
          status: 429,
          statusText: 'Too Many Requests',
          ...headers,
        })
      )
      .mockReturnValue(createSuccess({}))

    const ctx = await analytics.track('event')
    expect(ctx.attempts).toBe(1)

    expect(fetched).toHaveBeenCalledTimes(2)
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
