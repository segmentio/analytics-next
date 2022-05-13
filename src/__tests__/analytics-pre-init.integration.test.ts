import { AnalyticsBrowser } from '..'
import unfetch from 'unfetch'
import { mocked } from 'ts-jest/utils'
import { Analytics } from '../analytics'
import { AnalyticsBuffered } from '../analytics-pre-init'
import { Context } from '../core/context'
import * as Factory from './test-helpers/factories'

jest.mock('unfetch')

const mockFetchSettingsResponse = () => {
  mocked(unfetch).mockImplementation(() =>
    Factory.createSuccess({ integrations: {} })
  )
}

const writeKey = 'foo'

const errMsg = 'errMsg'

const sleep = (time: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, time)
  })

describe('Pre-initialization', () => {
  const trackSpy = jest.spyOn(Analytics.prototype, 'track')
  const identifySpy = jest.spyOn(Analytics.prototype, 'identify')
  const onSpy = jest.spyOn(Analytics.prototype, 'on')
  const readySpy = jest.spyOn(Analytics.prototype, 'ready')
  const browserLoadSpy = jest.spyOn(AnalyticsBrowser, 'load')
  const consoleErrorSpy = jest.spyOn(console, 'error')

  beforeEach(() => {
    AnalyticsBrowser._resetGlobalState()
    mockFetchSettingsResponse()
    ;(window as any).analytics = undefined
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  test('load should instantiate an AnalyticsBuffered object that resolves into an Analytics object', async () => {
    const analytics = AnalyticsBrowser.load({ writeKey })
    expect(analytics).toBeInstanceOf(AnalyticsBuffered)
    expect(analytics.instance).toBeUndefined()
    const [ajs, ctx] = await analytics
    expect(ajs).toBeInstanceOf(Analytics)
    expect(ctx).toBeInstanceOf(Context)
  })

  test('If a user sends a single pre-initialized track event, that event gets flushed', async () => {
    const analytics = AnalyticsBrowser.load({ writeKey })
    const trackCtxPromise = analytics.track('foo', { name: 'john' })
    const result = await trackCtxPromise
    expect(result).toBeInstanceOf(Context)
    expect(trackSpy).toBeCalledWith('foo', { name: 'john' })
    expect(trackSpy).toBeCalledTimes(1)
  })

  test('"return types should not change over the lifecycle for ordinary methods', async () => {
    const analytics = AnalyticsBrowser.load({ writeKey })

    const trackCtxPromise1 = analytics.track('foo', { name: 'john' })
    expect(trackCtxPromise1).toBeInstanceOf(Promise)
    const ctx1 = await trackCtxPromise1
    expect(ctx1).toBeInstanceOf(Context)

    // loaded
    const trackCtxPromise2 = analytics.track('foo', { name: 'john' })
    expect(trackCtxPromise2).toBeInstanceOf(Promise)
    const ctx2 = await trackCtxPromise2
    expect(ctx2).toBeInstanceOf(Context)
  })

  describe('errors', () => {
    test('rejected promise should work as expected for buffered analytics instances', async () => {
      trackSpy.mockImplementationOnce(() => Promise.reject(errMsg))
      const analytics = AnalyticsBrowser.load({ writeKey })
      try {
        await analytics.track('foo', { name: 'john' })
      } catch (err) {
        expect(err).toBe(errMsg)
      }
    })

    test('rejected promise should work as expected for initialized analytics instances', async () => {
      trackSpy.mockImplementationOnce(() => Promise.reject(errMsg))
      const [analytics] = await AnalyticsBrowser.load({ writeKey })
      try {
        await analytics.track('foo', { name: 'john' })
      } catch (err) {
        expect(err).toBe(errMsg)
      }
    })
  })

  test('If a user sends multiple events, all of those event gets flushed', async () => {
    const analytics = AnalyticsBrowser.load({ writeKey })
    const trackCtxPromise = analytics.track('foo', { name: 'john' })
    const trackCtxPromise2 = analytics.track('bar', { age: 123 })
    const identifyCtxPromise = analytics.identify('hello')

    await Promise.all([trackCtxPromise, trackCtxPromise2, identifyCtxPromise])

    expect(trackSpy).toBeCalledWith('foo', { name: 'john' })
    expect(trackSpy).toBeCalledWith('bar', { age: 123 })
    expect(trackSpy).toBeCalledTimes(2)

    expect(identifySpy).toBeCalledWith('hello')
    expect(identifySpy).toBeCalledTimes(1)
  })

  describe('snippet API with standalone', () => {
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

  describe('AnalyticsBrowser.on track', () => {
    test('If, before initialization, .on("track") is called, the .on method should be called after analytics load', async () => {
      const analytics = AnalyticsBrowser.load({ writeKey })
      const args = ['track', jest.fn()] as const
      analytics.on(...args)
      expect(onSpy).not.toHaveBeenCalledWith(...args)

      await analytics
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
      const analytics = AnalyticsBrowser.load({ writeKey })
      analytics.on('track', onTrackCb)
      await analytics
      await analytics.track('foo', { name: 123 })

      expect(onTrackCb).toHaveBeenCalledTimes(1)
      expect(onTrackCb).toHaveBeenCalledWith('foo', { name: 123 }, undefined)
    })
  })

  describe('emitter-like events', () => {
    test('"on, off, once" should return AnalyticsBuffered', () => {
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
      const analytics = AnalyticsBrowser.load({ writeKey })
      const identifyResult = analytics.identify('bar')
      const result = analytics
        .on('track', onTrackCb)
        .on('identify', onIdentifyCb)
        .once('group', jest.fn)
        .off('alias', jest.fn)

      expect(result instanceof AnalyticsBuffered).toBeTruthy()
      await analytics
      await analytics.track('foo', { name: 123 })
      await identifyResult
      expect(onTrackCb).toHaveBeenCalledTimes(1)
      expect(onTrackCb).toHaveBeenCalledWith('foo', { name: 123 }, undefined)

      expect(onIdentifyCb).toHaveBeenCalledTimes(1)
      expect(onIdentifyCb).toHaveBeenCalledWith('bar', {}, undefined)
    })

    test('"return types should not change over the lifecycle for chainable methods', async () => {
      const analytics = AnalyticsBrowser.load({ writeKey })

      const result1 = analytics.on('track', jest.fn)
      expect(result1).toBeInstanceOf(AnalyticsBuffered)
      await result1
      // loaded
      const result2 = analytics.on('track', jest.fn)
      expect(result2).toBeInstanceOf(AnalyticsBuffered)
    })
  })

  describe('thenable API', () => {
    it('should return expected instances', async () => {
      const analyticsThenable = AnalyticsBrowser.load({ writeKey: 'abc' })
      expect(analyticsThenable).toBeInstanceOf(AnalyticsBuffered)
      const [analyticsReal, context] = await analyticsThenable
      expect(analyticsReal).toBeInstanceOf<typeof Analytics>(Analytics)
      expect(context).toBeInstanceOf(Context)
    })

    it('should be capable of working well if using promise syntax', (done) => {
      const analyticsThenable = AnalyticsBrowser.load({ writeKey: 'abc' })
      const newPromise = analyticsThenable.then(([analytics, context]) => {
        expect(analytics).toBeInstanceOf<typeof Analytics>(Analytics)
        expect(context).toBeInstanceOf<typeof Context>(Context)
        done()
      })
      expect(newPromise).toBeInstanceOf<typeof Promise>(Promise)
    })

    it('should return the correct item if .then has a function registered', async () => {
      const analyticsThenable = AnalyticsBrowser.load({ writeKey: 'abc' })
      const obj = analyticsThenable.then(() => ({ foo: 123 } as const))
      expect(obj).toBeInstanceOf(Promise)
      const result = await obj
      expect(result.foo).toBe(123)
    })

    it('should be capable of handling errors if using promise syntax', () => {
      browserLoadSpy.mockImplementationOnce((): any => Promise.reject(errMsg))

      const analyticsThenable = AnalyticsBrowser.load({ writeKey: 'abc' })
      const newPromise = analyticsThenable.catch((reason) => {
        expect(reason).toBe(errMsg)
      })
      expect(newPromise).toBeInstanceOf(Promise)
      expect.assertions(2)
    })
  })

  describe('multi-instance', () => {
    it('should not throw an error', async () => {
      const analytics1 = AnalyticsBrowser.load({ writeKey: 'foo' })
      const analytics2 = AnalyticsBrowser.load({ writeKey: 'abc' })
      expect(analytics1).toBeInstanceOf(AnalyticsBuffered)
      expect(analytics2).toBeInstanceOf(AnalyticsBuffered)
      await analytics1
      await analytics2
    })
  })
})
