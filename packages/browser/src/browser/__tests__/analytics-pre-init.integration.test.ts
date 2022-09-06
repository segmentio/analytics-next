import { AnalyticsBrowser } from '../..'
import unfetch from 'unfetch'
import { Analytics } from '../../core/analytics'
import { Context } from '../../core/context'
import * as Factory from '../../test-helpers/factories'
import { sleep } from '../../lib/sleep'
import { setGlobalCDNUrl } from '../../lib/parse-cdn'
import { User } from '../../core/user'

jest.mock('unfetch')

const mockFetchSettingsSuccessResponse = () => {
  jest
    .mocked(unfetch)
    .mockImplementation(() => Factory.createSuccess({ integrations: {} }))
}

const mockFetchSettingsErrorResponse = (response?: Partial<Response>) => {
  jest.mocked(unfetch).mockImplementation(() => Factory.createError(response))
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
    mockFetchSettingsSuccessResponse()
    ;(window as any).analytics = undefined
  })

  describe('Smoke', () => {
    test('load should instantiate an object that resolves into an Analytics object', async () => {
      const ajsBrowser = AnalyticsBrowser.load({ writeKey })
      expect(ajsBrowser).toBeInstanceOf<typeof AnalyticsBrowser>(
        AnalyticsBrowser
      )
      expect(ajsBrowser.instance).toBeUndefined()
      const [ajs, ctx] = await ajsBrowser
      expect(ajsBrowser.instance).toBeInstanceOf<typeof Analytics>(Analytics)
      expect(ajsBrowser.ctx).toBeInstanceOf<typeof Context>(Context)
      expect(ajs).toBeInstanceOf<typeof Analytics>(Analytics)
      expect(ctx).toBeInstanceOf<typeof Context>(Context)
    })

    test('If a user sends a single pre-initialized track event, that event gets flushed', async () => {
      const ajsBrowser = AnalyticsBrowser.load({ writeKey })
      const trackCtxPromise = ajsBrowser.track('foo', { name: 'john' })
      const result = await trackCtxPromise
      expect(result).toBeInstanceOf(Context)
      expect(trackSpy).toBeCalledWith('foo', { name: 'john' })
      expect(trackSpy).toBeCalledTimes(1)
    })

    test('"return types should not change over the lifecycle for async methods', async () => {
      const ajsBrowser = AnalyticsBrowser.load({ writeKey })

      const trackCtxPromise1 = ajsBrowser.track('foo', { name: 'john' })
      expect(trackCtxPromise1).toBeInstanceOf(Promise)
      await ajsBrowser

      // loaded
      const trackCtxPromise2 = ajsBrowser.track('foo', { name: 'john' })
      expect(trackCtxPromise2).toBeInstanceOf(Promise)

      expect(await trackCtxPromise1).toBeInstanceOf(Context)
      expect(await trackCtxPromise2).toBeInstanceOf(Context)
    })

    test('return types should not change over lifecycle for sync methods', async () => {
      const ajsBrowser = AnalyticsBrowser.load({ writeKey })
      const user = ajsBrowser.user()
      expect(user).toBeInstanceOf(Promise)
      await ajsBrowser

      // loaded
      const user2 = ajsBrowser.user()
      expect(user2).toBeInstanceOf(Promise)

      expect(await user).toBeInstanceOf(User)
      expect(await user2).toBeInstanceOf(User)
    })

    test('version should return version', async () => {
      const ajsBrowser = AnalyticsBrowser.load({ writeKey })
      expect(typeof ajsBrowser.VERSION).toBe('string')
    })

    test('If a user sends multiple events, all of those event gets flushed', async () => {
      const ajsBrowser = AnalyticsBrowser.load({ writeKey })
      const trackCtxPromise = ajsBrowser.track('foo', { name: 'john' })
      const trackCtxPromise2 = ajsBrowser.track('bar', { age: 123 })
      const identifyCtxPromise = ajsBrowser.identify('hello')

      await Promise.all([trackCtxPromise, trackCtxPromise2, identifyCtxPromise])

      expect(trackSpy).toBeCalledWith('foo', { name: 'john' })
      expect(trackSpy).toBeCalledWith('bar', { age: 123 })
      expect(trackSpy).toBeCalledTimes(2)

      expect(identifySpy).toBeCalledWith('hello')
      expect(identifySpy).toBeCalledTimes(1)
    })

    test('should not throw on initialization failures', async () => {
      mockFetchSettingsErrorResponse()
      const ajs = AnalyticsBrowser.load({ writeKey })
      await sleep(100)
      expect(ajs.instance).toBeUndefined()
      void ajs.track('foo')
    })

    test('should log errors if network error', async () => {
      const err = {
        status: 403,
        statusText: 'Forbidden',
        json: undefined,
      }
      mockFetchSettingsErrorResponse(err)
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementationOnce(() => {})
      AnalyticsBrowser.load({ writeKey: 'abc' })
      await sleep(500)
      expect(consoleSpy).toBeCalled()
    })
  })

  describe('Promise API', () => {
    describe('.then', () => {
      test('.then should be called on success', (done) => {
        const ajsBrowser = AnalyticsBrowser.load({ writeKey: 'abc' })
        const newPromise = ajsBrowser.then(([analytics, context]) => {
          expect(analytics).toBeInstanceOf<typeof Analytics>(Analytics)
          expect(context).toBeInstanceOf<typeof Context>(Context)
          done()
        })
        expect(newPromise).toBeInstanceOf<typeof Promise>(Promise)
      })

      it('.then should pass to the next .then', async () => {
        const ajsBrowser = AnalyticsBrowser.load({ writeKey: 'abc' })
        const obj = ajsBrowser.then(() => ({ foo: 123 } as const))
        expect(obj).toBeInstanceOf(Promise)
        await obj.then((el) => expect(el.foo).toBe(123))
      })
    })

    describe('.catch', () => {
      it('should be capable of handling errors if using promise syntax', () => {
        browserLoadSpy.mockImplementationOnce((): any => Promise.reject(errMsg))

        const ajsBrowser = AnalyticsBrowser.load({ writeKey: 'abc' })
        const newPromise = ajsBrowser.catch((reason) => {
          expect(reason).toBe(errMsg)
        })
        expect(newPromise).toBeInstanceOf(Promise)
        expect.assertions(2)
      })
    })

    describe('.finally', () => {
      test('success', async () => {
        const ajsBrowser = AnalyticsBrowser.load({ writeKey: 'abc' })
        const thenCb = jest.fn()
        const finallyCb = jest.fn()
        const catchCb = jest.fn()
        await ajsBrowser.then(thenCb).catch(catchCb).finally(finallyCb)
        expect(catchCb).not.toBeCalled()
        expect(finallyCb).toBeCalledTimes(1)
        expect(thenCb).toBeCalledTimes(1)
      })
      test('rejection', async () => {
        browserLoadSpy.mockImplementationOnce((): any => Promise.reject(errMsg))
        const ajsBrowser = AnalyticsBrowser.load({ writeKey: 'abc' })
        const onFinallyCb = jest.fn()
        await ajsBrowser
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
      const ajsBrowser = AnalyticsBrowser.load({ writeKey })
      try {
        await ajsBrowser.track('foo', { name: 'john' })
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
      const ajsBrowser = AnalyticsBrowser.load({ writeKey })
      const args = ['track', jest.fn()] as const
      ajsBrowser.on(...args)
      expect(onSpy).not.toHaveBeenCalledWith(...args)

      await ajsBrowser
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
      const ajsBrowser = AnalyticsBrowser.load({ writeKey })
      ajsBrowser.on('track', onTrackCb)
      await ajsBrowser
      await ajsBrowser.track('foo', { name: 123 })

      expect(onTrackCb).toHaveBeenCalledTimes(1)
      expect(onTrackCb).toHaveBeenCalledWith('foo', { name: 123 }, undefined)
    })
    test('"on, off, once" should return ajsBrowser', () => {
      const analytics = AnalyticsBrowser.load({ writeKey })
      expect(
        [
          analytics.on('track', jest.fn),
          analytics.off('track', jest.fn),
          analytics.once('track', jest.fn),
        ].map((el) => el instanceof AnalyticsBrowser)
      ).toEqual([true, true, true])
    })

    test('"emitted" events should be chainable', async () => {
      const onTrackCb = jest.fn()
      const onIdentifyCb = jest.fn()
      const ajsBrowser = AnalyticsBrowser.load({ writeKey })
      const identifyResult = ajsBrowser.identify('bar')
      const result = ajsBrowser
        .on('track', onTrackCb)
        .on('identify', onIdentifyCb)
        .once('group', jest.fn)
        .off('alias', jest.fn)

      expect(result instanceof AnalyticsBrowser).toBeTruthy()
      await ajsBrowser.track('foo', { name: 123 })
      expect(onTrackCb).toHaveBeenCalledTimes(1)
      expect(onTrackCb).toHaveBeenCalledWith('foo', { name: 123 }, undefined)

      await identifyResult
      expect(onIdentifyCb).toHaveBeenCalledTimes(1)
      expect(onIdentifyCb).toHaveBeenCalledWith('bar', {}, undefined)
    })

    test('the "this" value of "emitted" event callbacks should be Analytics', async () => {
      const ajsBrowser = AnalyticsBrowser.load({ writeKey })
      ajsBrowser.on('track', function onTrackCb(this: any) {
        expect(this).toBeInstanceOf(Analytics)
      })
      ajsBrowser.once('group', function trackOnceCb(this: any) {
        expect(this).toBeInstanceOf(Analytics)
      })

      await Promise.all([
        ajsBrowser.track('foo', { name: 123 }),
        ajsBrowser.group('foo'),
      ])
    })

    test('"return types should not change over the lifecycle for chainable methods', async () => {
      const ajsBrowser = AnalyticsBrowser.load({ writeKey })

      const result1 = ajsBrowser.on('track', jest.fn)
      expect(result1).toBeInstanceOf(AnalyticsBrowser)
      await result1
      // loaded
      const result2 = ajsBrowser.on('track', jest.fn)
      expect(result2).toBeInstanceOf(AnalyticsBrowser)
    })
  })

  describe('Multi-instance', () => {
    it('should not throw an error', async () => {
      const ajsBrowser1 = AnalyticsBrowser.load({ writeKey: 'foo' })
      const ajsBrowser2 = AnalyticsBrowser.load({ writeKey: 'abc' })
      expect(ajsBrowser1).toBeInstanceOf(AnalyticsBrowser)
      expect(ajsBrowser2).toBeInstanceOf(AnalyticsBrowser)
      await ajsBrowser1
      await ajsBrowser2
    })
  })
})
