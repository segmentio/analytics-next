import { customerio, CustomerioSettings } from '..'
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

describe('retries', () => {
  let options: CustomerioSettings
  let analytics: Analytics
  let cio: Plugin
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
            queue = new PPQ.PersistedPriorityQueue(3, `test-Customer.io`)
            queue['__type'] = 'persisted'
            Object.defineProperty(PPQ, 'PersistedPriorityQueue', {
              writable: true,
              value: jest.fn().mockImplementation(() => queue),
            })
          }

          cio = customerio(analytics, options, {})

          await analytics.register(cio, pageEnrichment)
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
