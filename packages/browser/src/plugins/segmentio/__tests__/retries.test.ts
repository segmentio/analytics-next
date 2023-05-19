import { segmentio, SegmentioSettings } from '..'
import { Analytics } from '../../../core/analytics'
// @ts-ignore isOffline mocked dependency is accused as unused
import { isOffline } from '../../../core/connection'
import { Plugin } from '../../../core/plugin'
import { pageEnrichment } from '../../page-enrichment'
import { scheduleFlush } from '../schedule-flush'
import * as PPQ from '../../../lib/priority-queue/persisted'
import * as PQ from '../../../lib/priority-queue'
import { Context } from '../../../core/context'

jest.mock('../schedule-flush')

type QueueType = 'priority' | 'persisted'

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

        segment = segmentio(analytics, options, {})

        await analytics.register(segment, pageEnrichment)
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
