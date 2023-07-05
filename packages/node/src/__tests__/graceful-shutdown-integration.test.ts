import { TestFetchClient } from './test-helpers/test-fetch-client'
import { performance as perf } from 'perf_hooks'
import { Analytics } from '../app/analytics-node'
import { sleep } from './test-helpers/sleep'
import { Plugin, SegmentEvent } from '../app/types'
import { Context } from '../app/context'

const testPlugin: Plugin = {
  type: 'after',
  load: () => Promise.resolve(),
  name: 'foo',
  version: 'bar',
  isLoaded: () => true,
}

const testClient = new TestFetchClient()
const sendSpy = jest.spyOn(testClient, 'send')

describe('Ability for users to exit without losing events', () => {
  let ajs!: Analytics
  beforeEach(async () => {
    ajs = new Analytics({
      writeKey: 'abc123',
      maxEventsInBatch: 1,
      httpClient: testClient,
    })
  })
  const _helpers = {
    getFetchCalls: () =>
      sendSpy.mock.calls.map(([url, request]) => ({
        url,
        method: request.method,
        headers: request.headers,
        body: JSON.parse(request.body!),
      })),
    makeTrackCall: (analytics = ajs, cb?: (...args: any[]) => void) => {
      analytics.track({ userId: 'foo', event: 'Thing Updated' }, cb)
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
      ajs.track({ userId: 'foo', event: 'bar' }, cb)
      expect(cb).not.toHaveBeenCalled()
      await ajs.closeAndFlush()
      expect(cb).toBeCalled()
    })

    test('all async callbacks should be called', async () => {
      const trackCall = new Promise<Context>((resolve) => {
        ajs.track(
          {
            userId: 'abc',
            event: 'def',
          },
          (_, ctx) => sleep(200).then(() => resolve(ctx!))
        )
      })

      const res = await Promise.race([ajs.closeAndFlush(), trackCall])
      expect(res instanceof Context).toBe(true)
    })
  })

  describe('.closeAndFlush()', () => {
    test('default timeout should be related to flush interval', () => {
      const flushInterval = 500
      ajs = new Analytics({
        writeKey: 'abc123',
        flushInterval,
        httpClient: testClient,
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
      const startTime = perf.now()
      await ajs.closeAndFlush({ timeout: TIMEOUT })
      const elapsedTime = Math.round(perf.now() - startTime)
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
      expect(_helpers.getFetchCalls().length).toBe(1)
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

      expect(_helpers.getFetchCalls().length).toBe(2)

      expect(trackCalls).toBe(2)

      expect(drainedCalls).toBe(1)
    })

    test('if no pending events, resolves immediately', async () => {
      const startTime = perf.now()
      await ajs.closeAndFlush()
      const elapsedTime = perf.now() - startTime
      expect(elapsedTime > 0).toBeTruthy()
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

    test('should flush immediately if close is called and there are events in the segment.io plugin, but no more are expected', async () => {
      const analytics = new Analytics({
        writeKey: 'foo',
        flushInterval: 10000,
        maxEventsInBatch: 15,
        httpClient: testClient,
      })
      _helpers.makeTrackCall(analytics)
      _helpers.makeTrackCall(analytics)
      await sleep(100)

      // ensure all track events have reached the segment plugin
      expect(analytics['_publisher']['_batch']!.length).toBe(2)

      const startTime = perf.now()
      await analytics.closeAndFlush()
      const elapsedTime = perf.now() - startTime
      expect(elapsedTime).toBeLessThan(100)
      const calls = _helpers.getFetchCalls()
      expect(calls.length).toBe(1)
      expect(calls[0].body.batch.length).toBe(2)
    })

    test('should wait to flush if close is called and an event has not made it to the segment.io plugin yet', async () => {
      const TRACK_DELAY = 100
      const _testPlugin: Plugin = {
        ...testPlugin,
        track: async (ctx) => {
          await sleep(TRACK_DELAY)
          return ctx
        },
      }
      const analytics = new Analytics({
        writeKey: 'foo',
        flushInterval: 10000,
        maxEventsInBatch: 15,
        httpClient: testClient,
      })
      await analytics.register(_testPlugin)
      _helpers.makeTrackCall(analytics)
      _helpers.makeTrackCall(analytics)

      // ensure that track events have not reached the segment plugin before closeAndFlush is called.
      expect(analytics['_publisher']['_batch']).toBeFalsy()

      const startTime = perf.now()
      await analytics.closeAndFlush()
      const elapsedTime = perf.now() - startTime
      expect(elapsedTime).toBeGreaterThan(TRACK_DELAY)
      expect(elapsedTime).toBeLessThan(TRACK_DELAY * 2)
      const calls = _helpers.getFetchCalls()
      expect(calls.length).toBe(1)
      expect(calls[0].body.batch.length).toBe(2)
    })
  })
})
