import { createSuccess } from './test-helpers/factories'

const fetcher = jest.fn().mockReturnValue(createSuccess())
jest.mock('node-fetch', () => fetcher)

import { AnalyticsNode } from '../app/analytics-node'
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
  let ajs!: AnalyticsNode
  beforeEach(async () => {
    jest.resetAllMocks()
    ajs = new AnalyticsNode({
      drainedDelay: 100,
      writeKey: 'abc123',
    })
  })
  const _helpers = {
    makeTrackCall: (analytics = ajs, cb?: (...args: any[]) => void) => {
      analytics.track({ userId: 'foo', event: 'Thing Updated', callback: cb })
    },
    listenOnDrain: (): Promise<undefined> => {
      return new Promise((resolve) => {
        ajs.once('drained', () => resolve(undefined))
      })
    },
  }

  describe('drained emitted event', () => {
    test('Analytics should emit a drained event and respect the drained delay', async () => {
      const DRAINED_DELAY = 500
      ajs = new AnalyticsNode({
        writeKey: 'abc123',
        drainedDelay: DRAINED_DELAY,
      })
      _helpers.makeTrackCall()
      const startTime = Date.now()
      const drainedCbArgs = await _helpers.listenOnDrain()
      const drainedTime = Date.now() - startTime
      expect(drainedTime).toBeGreaterThan(DRAINED_DELAY)
      expect(drainedTime).toBeLessThan(DRAINED_DELAY + 200)

      expect(drainedCbArgs).toBeUndefined()
    })

    test('every time a new event enters the queue, the timeout should be reset (like debounce)', async () => {
      const DRAINED_DELAY = 250
      ajs = new AnalyticsNode({
        writeKey: 'abc123',
        drainedDelay: DRAINED_DELAY,
      })
      await ajs.register({
        ...testPlugin,
        track: async (ctx) => {
          await sleep(50) // should be
          return ctx
        },
      })
      await new Promise((resolve) =>
        _helpers.makeTrackCall(undefined, () => resolve(undefined))
      )
      _helpers.makeTrackCall()

      const startTime = Date.now()
      await _helpers.listenOnDrain()
      const drainedTime = Date.now() - startTime
      expect(drainedTime).toBeGreaterThan(DRAINED_DELAY)
      expect(drainedTime).toBeLessThan(DRAINED_DELAY + 200)
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

    test('if queue has multiple track events, all of those items should be dispatched, and drain and  track events should be emitted', async () => {
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
