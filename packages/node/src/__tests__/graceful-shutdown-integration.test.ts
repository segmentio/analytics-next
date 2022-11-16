import { createSuccess } from './test-helpers/factories'

const fetcher = jest.fn()
jest.mock('../lib/fetch', () => ({ fetch: fetcher }))

import { Analytics, SegmentEvent } from '../app/analytics-node'
import { sleep } from './test-helpers/sleep'
import { CoreContext, CorePlugin } from '@segment/analytics-core'

const testPlugin: CorePlugin = {
  type: 'after',
  load: () => Promise.resolve(),
  name: 'foo',
  version: 'bar',
  isLoaded: () => true,
}

describe('Ability for users to exit without losing events', () => {
  let ajs!: Analytics
  beforeEach(async () => {
    jest.resetAllMocks()
    fetcher.mockReturnValue(createSuccess())
    ajs = new Analytics({
      writeKey: 'abc123',
      maxEventsInBatch: 1,
    })
  })
  const _helpers = {
    makeTrackCall: (analytics = ajs, cb?: (...args: any[]) => void) => {
      analytics.track({ userId: 'foo', event: 'Thing Updated', callback: cb })
    },
  }

  describe('drained emitted event', () => {
    test('emits a drained event if only one event is dispatched', async () => {
      _helpers.makeTrackCall()
      return expect(
        new Promise((resolve) => ajs.once('drained', () => resolve(undefined)))
      ).resolves.toBe(undefined)
    })

    test('emits a drained event if multiple events are dispatched', async () => {
      let drainedCalls = 0
      ajs.on('drained', () => {
        drainedCalls++
      })
      _helpers.makeTrackCall()
      _helpers.makeTrackCall()
      _helpers.makeTrackCall()
      await sleep(200)
      expect(drainedCalls).toBe(1)
    })

    test('all callbacks should be called ', async () => {
      const cb = jest.fn()
      ajs.track({ userId: 'foo', event: 'bar', callback: cb })
      expect(cb).not.toHaveBeenCalled()
      await ajs.closeAndFlush()
      expect(cb).toBeCalled()
    })

    test('all async callbacks should be called', async () => {
      const trackCall = new Promise<CoreContext>((resolve) =>
        ajs.track({
          userId: 'abc',
          event: 'def',
          callback: (ctx) => {
            return sleep(100).then(() => resolve(ctx))
          },
        })
      )
      const res = await Promise.race([ajs.closeAndFlush(), trackCall])
      expect(res instanceof CoreContext).toBe(true)
    })
  })

  describe('.closeAndFlush()', () => {
    test('default timeout should be related to flush interval', () => {
      const flushInterval = 500
      ajs = new Analytics({
        writeKey: 'abc123',
        flushInterval,
      })
      const closeAndFlushTimeout = ajs['_closeAndFlushDefaultTimeout']
      expect(closeAndFlushTimeout).toBe(flushInterval * 1.25)
    })

    test('should force resolve if method call execution time exceeds specified timeout', async () => {
      const TIMEOUT = 300
      await ajs.register({
        ...testPlugin,
        track: async (ctx) => {
          await sleep(1000)
          return ctx
        },
      })
      _helpers.makeTrackCall(ajs)
      const startTime = Date.now()
      await ajs.closeAndFlush({ timeout: TIMEOUT })
      const elapsedTime = Math.round(Date.now() - startTime)
      expect(elapsedTime).toBeLessThanOrEqual(TIMEOUT + 10)
      expect(elapsedTime).toBeGreaterThan(TIMEOUT - 10)
    })

    test('no new events should be accepted (but existing ones should be flushed)', async () => {
      let trackCallCount = 0
      ajs.on('track', () => {
        // track should only happen after successful dispatch
        trackCallCount += 1
      })
      _helpers.makeTrackCall()
      const closed = ajs.closeAndFlush()
      _helpers.makeTrackCall() // should not trigger
      _helpers.makeTrackCall() // should not trigger
      await closed
      expect(fetcher).toBeCalledTimes(1)
      expect(trackCallCount).toBe(1)
    })

    test('any events created after close should be emitted', async () => {
      const events: SegmentEvent[] = []
      ajs.on('call_after_close', (event) => {
        events.push(event)
      })
      _helpers.makeTrackCall()
      const closed = ajs.closeAndFlush()
      _helpers.makeTrackCall() // should be emitted
      _helpers.makeTrackCall() // should be emitted
      expect(events.length).toBe(2)
      expect(events.every((e) => e.type === 'track')).toBeTruthy()
      await closed
    })

    test('if queue has multiple track events, all of those items should be dispatched, and drain and track events should be emitted', async () => {
      let drainedCalls = 0
      ajs.on('drained', () => {
        drainedCalls++
      })
      let trackCalls = 0
      ajs.on('track', () => {
        trackCalls++
      })
      await ajs.register({
        ...testPlugin,
        track: async (ctx) => {
          await sleep(300)
          return ctx
        },
      })
      _helpers.makeTrackCall()
      _helpers.makeTrackCall()

      await ajs.closeAndFlush()

      expect(fetcher.mock.calls.length).toBe(2)

      expect(trackCalls).toBe(2)

      expect(drainedCalls).toBe(1)
    })

    test('if no pending events, resolves immediately', async () => {
      const startTime = Date.now()
      await ajs.closeAndFlush()
      const elapsedTime = startTime - Date.now()
      expect(elapsedTime).toBeLessThan(20)
    })

    test('if no pending events, drained should not be emitted an extra time when close is called', async () => {
      let called = false
      ajs.on('drained', () => {
        called = true
      })
      await ajs.closeAndFlush()
      expect(called).toBeFalsy()
    })
  })
})
