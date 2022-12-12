const fetcher = jest.fn()
jest.mock('../lib/fetch', () => ({ fetch: fetcher }))

import { createError, createSuccess } from './test-helpers/factories'
import { createTestAnalytics } from './test-helpers/create-test-analytics'
import { Context } from '../app/context'

describe('Callback behavior', () => {
  beforeEach(() => {
    fetcher.mockReturnValue(createSuccess())
  })

  it('should handle success', async () => {
    const ajs = createTestAnalytics({ maxEventsInBatch: 1 })
    const ctx = await new Promise<Context>((resolve, reject) =>
      ajs.track(
        {
          anonymousId: 'bar',
          event: 'event name',
        },
        (err, ctx) => {
          if (err) reject('test fail')
          resolve(ctx!)
        }
      )
    )
    expect(ctx.event.event).toBe('event name')
    expect(ctx.event.anonymousId).toBe('bar')
  })

  it('should handle errors', async () => {
    fetcher.mockReturnValue(createError())
    const ajs = createTestAnalytics({ maxEventsInBatch: 1 })
    const [err, ctx] = await new Promise<[any, Context]>((resolve) =>
      ajs.track(
        {
          anonymousId: 'bar',
          event: 'event name',
        },
        (err, ctx) => {
          resolve([err!, ctx!])
        }
      )
    )
    expect(ctx.event.event).toBe('event name')
    expect(ctx.event.anonymousId).toBe('bar')
    expect(err).toEqual(new Error('[404] Not Found'))
  })
})
