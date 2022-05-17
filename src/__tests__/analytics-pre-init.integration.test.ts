import { AnalyticsBrowser } from '..'
import unfetch from 'unfetch'
import { mocked } from 'ts-jest/utils'
import { Analytics } from '../analytics'
import { AnalyticsBuffered } from '../analytics-pre-init'
import { Context } from '../core/context'
import * as Factory from './test-helpers/factories'
import { sleep } from './test-helpers/sleep'
import { setGlobalCDNUrl } from '../lib/parse-cdn'

jest.mock('unfetch')

const mockFetchSettingsResponse = () => {
  mocked(unfetch).mockImplementation(() =>
    Factory.createSuccess({ integrations: {} })
  )
}

const writeKey = 'foo'

const errMsg = 'errMsg'

describe('Pre-initialization', () => {
  const trackSpy = jest.spyOn(Analytics.prototype, 'track')
  const identifySpy = jest.spyOn(Analytics.prototype, 'identify')
  const onSpy = jest.spyOn(Analytics.prototype, 'on')
  const readySpy = jest.spyOn(Analytics.prototype, 'ready')
  const browserLoadSpy = jest.spyOn(AnalyticsBrowser, 'load')
  const consoleErrorSpy = jest.spyOn(console, 'error')

  beforeEach(() => {
    setGlobalCDNUrl(undefined as any)
    mockFetchSettingsResponse()
    ;(window as any).analytics = undefined
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('Smoke', () => {
    test('load should instantiate an ajsBuffered object that resolves into an Analytics object', async () => {
      const ajsBuffered = AnalyticsBrowser.load({ writeKey })
      expect(ajsBuffered).toBeInstanceOf<typeof AnalyticsBuffered>(
        AnalyticsBuffered
      )
      expect(ajsBuffered.instance).toBeUndefined()
      const [ajs, ctx] = await ajsBuffered
      expect(ajsBuffered.instance).toBeInstanceOf<typeof Analytics>(Analytics)
      expect(ajsBuffered.ctx).toBeInstanceOf<typeof Context>(Context)
      expect(ajs).toBeInstanceOf<typeof Analytics>(Analytics)
      expect(ctx).toBeInstanceOf<typeof Context>(Context)
    })

    test('If a user sends a single pre-initialized track event, that event gets flushed', async () => {
      const ajsBuffered = AnalyticsBrowser.load({ writeKey })
      const trackCtxPromise = ajsBuffered.track('foo', { name: 'john' })
      const result = await trackCtxPromise
      expect(result).toBeInstanceOf(Context)
      expect(trackSpy).toBeCalledWith('foo', { name: 'john' })
      expect(trackSpy).toBeCalledTimes(1)
    })

    test('"return types should not change over the lifecycle for ordinary methods', async () => {
      const ajsBuffered = AnalyticsBrowser.load({ writeKey })

      const trackCtxPromise1 = ajsBuffered.track('foo', { name: 'john' })
      expect(trackCtxPromise1).toBeInstanceOf(Promise)
      const ctx1 = await trackCtxPromise1
      expect(ctx1).toBeInstanceOf(Context)

      // loaded
      const trackCtxPromise2 = ajsBuffered.track('foo', { name: 'john' })
      expect(trackCtxPromise2).toBeInstanceOf(Promise)
      const ctx2 = await trackCtxPromise2
      expect(ctx2).toBeInstanceOf(Context)
    })

    test('If a user sends multiple events, all of those event gets flushed', async () => {
      const ajsBuffered = AnalyticsBrowser.load({ writeKey })
      const trackCtxPromise = ajsBuffered.track('foo', { name: 'john' })
      const trackCtxPromise2 = ajsBuffered.track('bar', { age: 123 })
      const identifyCtxPromise = ajsBuffered.identify('hello')

      await Promise.all([trackCtxPromise, trackCtxPromise2, identifyCtxPromise])

      expect(trackSpy).toBeCalledWith('foo', { name: 'john' })
      expect(trackSpy).toBeCalledWith('bar', { age: 123 })
      expect(trackSpy).toBeCalledTimes(2)

      expect(identifySpy).toBeCalledWith('hello')
      expect(identifySpy).toBeCalledTimes(1)
    })
  })

  describe('Promise API', () => {
    describe('.then', () => {
      test('.then should be called on success', (done) => {
        const ajsBuffered = AnalyticsBrowser.load({ writeKey: 'abc' })
        const newPromise = ajsBuffered.then(([analytics, context]) => {
          expect(analytics).toBeInstanceOf<typeof Analytics>(Analytics)
          expect(context).toBeInstanceOf<typeof Context>(Context)
          done()
        })
        expect(newPromise).toBeInstanceOf<typeof Promise>(Promise)
      })

      it('.then should pass to the next .then', async () => {
        const ajsBuffered = AnalyticsBrowser.load({ writeKey: 'abc' })
        const obj = ajsBuffered.then(() => ({ foo: 123 } as const))
        expect(obj).toBeInstanceOf(Promise)
        await obj.then((el) => expect(el.foo).toBe(123))
      })
    })

    describe('.catch', () => {
      it('should be capable of handling errors if using promise syntax', () => {
        browserLoadSpy.mockImplementationOnce((): any => Promise.reject(errMsg))

        const ajsBuffered = AnalyticsBrowser.load({ writeKey: 'abc' })
        const newPromise = ajsBuffered.catch((reason) => {
          expect(reason).toBe(errMsg)
        })
        expect(newPromise).toBeInstanceOf(Promise)
        expect.assertions(2)
      })
    })

    describe('.finally', () => {
      test('success', async () => {
        const ajsBuffered = AnalyticsBrowser.load({ writeKey: 'abc' })
        const thenCb = jest.fn()
        const finallyCb = jest.fn()
        const catchCb = jest.fn()
        await ajsBuffered.then(thenCb).catch(catchCb).finally(finallyCb)
        expect(catchCb).not.toBeCalled()
        expect(finallyCb).toBeCalledTimes(1)
        expect(thenCb).toBeCalledTimes(1)
      })
      test('rejection', async () => {
        browserLoadSpy.mockImplementationOnce((): any => Promise.reject(errMsg))
        const ajsBuffered = AnalyticsBrowser.load({ writeKey: 'abc' })
        const onFinallyCb = jest.fn()
        await ajsBuffered
          .catch((reason) => {
            expect(reason).toBe(errMsg)
          })
          .finally(() => {
            onFinallyCb()
          })
        expect(onFinallyCb).toBeCalledTimes(1)
        expect.assertions(2)
      })
    })
  })

  describe('Load failures', () => {
    test('rejected promise should work as expected for buffered analytics instances', async () => {
      trackSpy.mockImplementationOnce(() => Promise.reject(errMsg))
      const ajsBuffered = AnalyticsBrowser.load({ writeKey })
      try {
        await ajsBuffered.track('foo', { name: 'john' })
      } catch (err) {
        expect(err).toBe(errMsg)
      }
      expect.assertions(1)
    })

    test('rejected promise should work as expected for initialized analytics instances', async () => {
      trackSpy.mockImplementationOnce(() => Promise.reject(errMsg))
      const [analytics] = await AnalyticsBrowser.load({ writeKey })
      try {
        await analytics.track('foo', { name: 'john' })
      } catch (err) {
        expect(err).toBe(errMsg)
      }
      expect.assertions(1)
    })
  })

  describe('Snippet / standalone', () => {
    test('If a snippet user sends multiple events, all of those event gets flushed', async () => {
      const onTrackCb = jest.fn()
      const onTrack = ['on', 'track', onTrackCb]
      const track = ['track', 'foo']
      const track2 = ['track', 'bar']
      const identify = ['identify']

      ;(window as any).analytics = [onTrack, track, track2, identify]

      await AnalyticsBrowser.standalone(writeKey)

      await sleep(100) // the snippet does not return a promise (pre-initialization) ... it sometimes has a callback as the third argument.
      expect(trackSpy).toBeCalledWith('foo')
      expect(trackSpy).toBeCalledWith('bar')
      expect(trackSpy).toBeCalledTimes(2)

      expect(identifySpy).toBeCalledWith()
      expect(identifySpy).toBeCalledTimes(1)

      expect(onSpy).toBeCalledTimes(1)

      expect(onTrackCb).toBeCalledTimes(2) // gets called once for each track event
      expect(onTrackCb).toBeCalledWith('foo', {}, undefined)
      expect(onTrackCb).toBeCalledWith('bar', {}, undefined)
    })
    test('If a snippet user has an event "fail", it will not create a promise rejection or effect other method calls', async () => {
      identifySpy.mockImplementationOnce(() => {
        return Promise.reject('identity rejection')
      })
      consoleErrorSpy.mockImplementationOnce(() => null)

      const onTrackCb = jest.fn()
      const onTrack = ['on', 'track', onTrackCb]
      const track = ['track', 'foo']
      const track2 = ['track', 'bar']
      const identify = ['identify']

      ;(window as any).analytics = [identify, onTrack, track, track2]

      await AnalyticsBrowser.standalone(writeKey)

      await sleep(100) // the snippet does not return a promise (pre-initialization) ... it sometimes has a callback as the third argument.
      expect(trackSpy).toBeCalledWith('foo')
      expect(trackSpy).toBeCalledWith('bar')
      expect(trackSpy).toBeCalledTimes(2)

      expect(identifySpy).toBeCalledWith()
      expect(identifySpy).toBeCalledTimes(1)
      expect(consoleErrorSpy).toBeCalledTimes(1)
      expect(consoleErrorSpy).toBeCalledWith('identity rejection')

      expect(onSpy).toBeCalledTimes(1)

      expect(onTrackCb).toBeCalledTimes(2) // gets called once for each track event
      expect(onTrackCb).toBeCalledWith('foo', {}, undefined)
      expect(onTrackCb).toBeCalledWith('bar', {}, undefined)
    })
  })

  describe('Emitter methods', () => {
    test('If, before initialization, .on("track") is called, the .on method should be called after analytics load', async () => {
      const ajsBuffered = AnalyticsBrowser.load({ writeKey })
      const args = ['track', jest.fn()] as const
      ajsBuffered.on(...args)
      expect(onSpy).not.toHaveBeenCalledWith(...args)

      await ajsBuffered
      expect(onSpy).toBeCalledWith(...args)
      expect(onSpy).toHaveBeenCalledTimes(1)
    })

    test('If, before initialization .on("track") is called and then .track is called, the callback method should be called after analytics loads', async () => {
      const onFnCb = jest.fn()
      const analytics = AnalyticsBrowser.load({ writeKey })
      analytics.on('track', onFnCb)
      const trackCtxPromise = analytics.track('foo', { name: 123 })

      expect(onFnCb).not.toHaveBeenCalled()

      await Promise.all([analytics, trackCtxPromise])

      expect(onSpy).toBeCalledWith('track', onFnCb)
      expect(onSpy).toHaveBeenCalledTimes(1)

      expect(onFnCb).toHaveBeenCalledWith('foo', { name: 123 }, undefined)
      expect(onFnCb).toHaveBeenCalledTimes(1)
    })

    test('If, before initialization, .ready is called, the callback method should be called after analytics loads', async () => {
      const onReadyCb = jest.fn()
      const analytics = AnalyticsBrowser.load({ writeKey })
      const onReadyPromise = analytics.ready(onReadyCb)
      expect(onReadyCb).not.toHaveBeenCalled()
      await onReadyPromise
      expect(readySpy).toHaveBeenCalledTimes(1)
      expect(onReadyCb).toHaveBeenCalledTimes(1)
      expect(readySpy).toHaveBeenCalledWith(expect.any(Function))
    })

    test('Should work with "on" events if a track event is called after load is complete', async () => {
      const onTrackCb = jest.fn()
      const ajsBuffered = AnalyticsBrowser.load({ writeKey })
      ajsBuffered.on('track', onTrackCb)
      await ajsBuffered
      await ajsBuffered.track('foo', { name: 123 })

      expect(onTrackCb).toHaveBeenCalledTimes(1)
      expect(onTrackCb).toHaveBeenCalledWith('foo', { name: 123 }, undefined)
    })
    test('"on, off, once" should return ajsBuffered', () => {
      const analytics = AnalyticsBrowser.load({ writeKey })
      expect(
        [
          analytics.on('track', jest.fn),
          analytics.off('track', jest.fn),
          analytics.once('track', jest.fn),
        ].map((el) => el instanceof AnalyticsBuffered)
      ).toEqual([true, true, true])
    })

    test('"emitted" events should be chainable', async () => {
      const onTrackCb = jest.fn()
      const onIdentifyCb = jest.fn()
      const ajsBuffered = AnalyticsBrowser.load({ writeKey })
      const identifyResult = ajsBuffered.identify('bar')
      const result = ajsBuffered
        .on('track', onTrackCb)
        .on('identify', onIdentifyCb)
        .once('group', jest.fn)
        .off('alias', jest.fn)

      expect(result instanceof AnalyticsBuffered).toBeTruthy()
      await ajsBuffered.track('foo', { name: 123 })
      expect(onTrackCb).toHaveBeenCalledTimes(1)
      expect(onTrackCb).toHaveBeenCalledWith('foo', { name: 123 }, undefined)

      await identifyResult
      expect(onIdentifyCb).toHaveBeenCalledTimes(1)
      expect(onIdentifyCb).toHaveBeenCalledWith('bar', {}, undefined)
    })

    test('"return types should not change over the lifecycle for chainable methods', async () => {
      const ajsBuffered = AnalyticsBrowser.load({ writeKey })

      const result1 = ajsBuffered.on('track', jest.fn)
      expect(result1).toBeInstanceOf(AnalyticsBuffered)
      await result1
      // loaded
      const result2 = ajsBuffered.on('track', jest.fn)
      expect(result2).toBeInstanceOf(AnalyticsBuffered)
    })
  })

  describe('Multi-instance', () => {
    it('should not throw an error', async () => {
      const ajsBuffered1 = AnalyticsBrowser.load({ writeKey: 'foo' })
      const ajsBuffered2 = AnalyticsBrowser.load({ writeKey: 'abc' })
      expect(ajsBuffered1).toBeInstanceOf(AnalyticsBuffered)
      expect(ajsBuffered2).toBeInstanceOf(AnalyticsBuffered)
      await ajsBuffered1
      await ajsBuffered2
    })
  })
})
