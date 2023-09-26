import {
  AnalyticsBuffered,
  callAnalyticsMethod,
  PreInitMethodCall,
  flushAnalyticsCallsInNewTask,
  PreInitMethodCallBuffer,
  PreInitMethodName,
} from '..'
import { Analytics } from '../../analytics'
import { Context } from '../../context'
import { sleep } from '../../../lib/sleep'
import { User } from '../../user'
import { getBufferedPageCtxFixture } from '../../../test-helpers/fixtures'
import * as GlobalAnalytics from '../../../lib/global-analytics-helper'

describe(PreInitMethodCallBuffer, () => {
  beforeEach(() => {
    GlobalAnalytics.setGlobalAnalytics(undefined as any)
  })

  describe('toArray()', () => {
    it('should convert the map back to an array', () => {
      const call1 = new PreInitMethodCall('identify', [], jest.fn())
      const call2 = new PreInitMethodCall('identify', [], jest.fn())
      const call3 = new PreInitMethodCall('group', [], jest.fn())
      const buffer = new PreInitMethodCallBuffer(call1, call2, call3)
      expect(buffer.toArray()).toEqual([call1, call2, call3])
    })

    it('should also read from global analytics buffer', () => {
      const call1 = new PreInitMethodCall('identify', ['foo'], jest.fn())
      ;(window as any).analytics = [['track', 'snippet']]

      const buffer = new PreInitMethodCallBuffer(call1)
      const calls = buffer.toArray()
      expect(calls.length).toBe(2)
      expect(calls[0]).toEqual(
        expect.objectContaining<Partial<PreInitMethodCall>>({
          method: 'track',
          args: ['snippet', getBufferedPageCtxFixture()],
        })
      )
      expect(calls[1]).toEqual(call1)
    })
  })

  describe('push()', () => {
    it('should add method calls', () => {
      const call1 = new PreInitMethodCall('identify', [], jest.fn())
      const buffer = new PreInitMethodCallBuffer()
      buffer.push(call1)
      expect(buffer.toArray()).toEqual([call1])
    })

    it('should work if the calls were added at different times or in different ways', () => {
      const call1 = new PreInitMethodCall('identify', [], jest.fn())
      const call2 = new PreInitMethodCall('identify', [], jest.fn())
      const call3 = new PreInitMethodCall('group', [], jest.fn())
      const call4 = new PreInitMethodCall('group', [], jest.fn())
      const buffer = new PreInitMethodCallBuffer(call1)
      buffer.push(call2, call3)
      buffer.push(call4)
      expect(buffer.toArray()).toEqual([call1, call2, call3, call4])
    })
  })

  describe('getCalls()', () => {
    it('should fetch calls by name', async () => {
      const buffer = new PreInitMethodCallBuffer()
      const call1 = new PreInitMethodCall('identify', [], jest.fn())
      const call2 = new PreInitMethodCall('identify', [], jest.fn())
      const call3 = new PreInitMethodCall('group', [], jest.fn())
      buffer.push(call1, call2, call3)
      expect(buffer.getCalls('identify')).toEqual([call1, call2])
      expect(buffer.getCalls('group')).toEqual([call3])
    })
    it('should read from Snippet Buffer', () => {
      const call1 = new PreInitMethodCall('identify', ['foo'], jest.fn())
      GlobalAnalytics.setGlobalAnalytics([['identify', 'snippet']] as any)

      const buffer = new PreInitMethodCallBuffer(call1)
      const calls = buffer.getCalls('identify')
      expect(calls.length).toBe(2)
      expect(calls[0]).toEqual(
        expect.objectContaining<Partial<PreInitMethodCall>>({
          method: 'identify',
          args: ['snippet', getBufferedPageCtxFixture()],
        })
      )
      expect(calls[1]).toEqual(call1)
    })
  })
  describe('clear()', () => {
    it('should clear calls', () => {
      const call1 = new PreInitMethodCall('identify', [], jest.fn())
      const call2 = new PreInitMethodCall('identify', [], jest.fn())
      const call3 = new PreInitMethodCall('group', [], jest.fn())
      GlobalAnalytics.setGlobalAnalytics([['track', 'bar']] as any)
      const buffer = new PreInitMethodCallBuffer(call1, call2, call3)
      buffer.clear()
      expect(buffer.toArray()).toEqual([])
      expect(GlobalAnalytics.getGlobalAnalytics()).toEqual([])
    })
  })

  describe('Snippet buffer (method calls)', () => {
    it('should be read from the global analytics instance', () => {
      const getGlobalAnalyticsSpy = jest.spyOn(
        GlobalAnalytics,
        'getGlobalAnalytics'
      )

      const buffer = new PreInitMethodCallBuffer()
      expect(getGlobalAnalyticsSpy).not.toBeCalled()
      buffer.toArray()
      expect(getGlobalAnalyticsSpy).toBeCalled()
    })
  })
  describe('BufferedPageContext', () => {
    test.each([
      'track',
      'screen',
      'alias',
      'group',
      'page',
      'identify',
    ] as PreInitMethodName[])('should be appended to %p calls.', (method) => {
      const call = new PreInitMethodCall(method, ['foo'], jest.fn())
      expect(call.args).toEqual(['foo', getBufferedPageCtxFixture()])
    })
    it('should not be appended for other method calls', () => {
      const fn = jest.fn()
      const onCall = new PreInitMethodCall('on', ['foo', fn])
      expect(onCall.args).toEqual(['foo', fn])
      const setAnonIdCall = new PreInitMethodCall('setAnonymousId', [])
      expect(setAnonIdCall.args).toEqual([])
    })
  })
})

describe(AnalyticsBuffered, () => {
  describe('Happy path', () => {
    it('should return a promise-like object', async () => {
      const ajs = new Analytics({ writeKey: 'foo' })
      const ctx = new Context({ type: 'track' })
      const buffered = new AnalyticsBuffered(() =>
        Promise.resolve<[Analytics, Context]>([ajs, ctx])
      )
      expect(buffered).toBeInstanceOf(AnalyticsBuffered)
      expect(typeof buffered.then).toBe('function')
      expect(typeof buffered.catch).toBe('function')
      expect(typeof buffered.finally).toBe('function')
    })

    it('should have instance and ctx properties defined when loader is done', async () => {
      const ajs = new Analytics({ writeKey: 'foo' })
      const ctx = new Context({ type: 'track' })
      const buffered = new AnalyticsBuffered(() =>
        Promise.resolve<[Analytics, Context]>([ajs, ctx])
      )
      expect(buffered.instance).not.toBeDefined()
      expect(buffered.ctx).not.toBeDefined()
      await buffered // finish loading
      expect(buffered.instance).toBe(ajs)
      expect(buffered.ctx).toBe(ctx)
    })

    it('should convert to a promise on await', async () => {
      const ajs = new Analytics({ writeKey: 'foo' })
      const ctx = new Context({ type: 'track' })
      const [analytics, context] = await new AnalyticsBuffered(() => {
        return Promise.resolve<[Analytics, Context]>([ajs, ctx])
      })

      expect(analytics).toEqual(ajs)
      expect(context).toEqual(ctx)
    })

    it('should wrap async methods in a promise', async () => {
      const ajs = new Analytics({ writeKey: 'foo' })
      const ctx = new Context({ type: 'track' })

      ajs.track = () => Promise.resolve(ctx)

      const buffered = new AnalyticsBuffered((buffer) => {
        return new Promise((resolve) =>
          setTimeout(() => {
            flushAnalyticsCallsInNewTask(ajs, buffer)
            resolve([ajs, ctx])
          }, 0)
        )
      })
      const result = buffered.track('foo')
      expect(result).toBeInstanceOf(Promise)

      await buffered

      const result2 = buffered.track('bar')
      expect(result2).toBeInstanceOf(Promise)

      expect(await result).toBeInstanceOf(Context)
      expect(await result2).toBeInstanceOf(Context)
    })

    it('should wrap synchronous methods in a promise', async () => {
      const ajs = new Analytics({ writeKey: 'foo' })
      ajs.user = () => new User()
      const ctx = new Context({ type: 'track' })

      const buffered = new AnalyticsBuffered((buffer) => {
        return new Promise((resolve) =>
          setTimeout(() => {
            flushAnalyticsCallsInNewTask(ajs, buffer)
            resolve([ajs, ctx])
          }, 0)
        )
      })
      const result = buffered.user()
      expect(result).toBeInstanceOf(Promise)

      await buffered

      const result2 = buffered.user()
      expect(result2).toBeInstanceOf(Promise)

      expect(await result).toBeInstanceOf(User)
      expect(await result2).toBeInstanceOf(User)
    })

    describe('the "this" value of proxied analytics methods', () => {
      test('should be the ajs instance for non-chainable methods (that return a promise)', async () => {
        const ajs = new Analytics({ writeKey: 'foo' })
        jest.spyOn(ajs, 'track').mockImplementation(function (this: Analytics) {
          expect(this).toBe(ajs)
          return Promise.resolve(ctx)
        })
        const ctx = new Context({ type: 'track' })
        const result: [Analytics, Context] = [ajs, ctx]
        const buffered = new AnalyticsBuffered(() => Promise.resolve(result))
        await buffered
        void buffered.track('foo', {})
        expect.assertions(1)
      })
    })

    test('should be the ajs instance for chainable methods', async () => {
      const ajs = new Analytics({ writeKey: 'foo' })
      jest.spyOn(ajs, 'on').mockImplementation(function (this: Analytics) {
        expect(this).toBe(ajs)
        return ajs
      })
      const ctx = new Context({ type: 'page' })
      const result: [Analytics, Context] = [ajs, ctx]
      const buffered = new AnalyticsBuffered(() => Promise.resolve(result))
      await buffered
      void buffered.on('foo', jest.fn)
      expect.assertions(1)
    })
  })

  describe('Unhappy path', () => {
    test('Will throw an error if the callback throws', async () => {
      try {
        new AnalyticsBuffered(() => {
          throw 'oops!'
        })
      } catch (err) {
        expect(err).toBe('oops!')
      }
      expect.assertions(1)
    })
    test('Will throw if a promise rejection', async () => {
      try {
        await new AnalyticsBuffered(() => Promise.reject('oops!'))
      } catch (err) {
        expect(err).toBe('oops!')
      }
      expect.assertions(1)
    })

    test('Will ignore the .then if there is a catch block', () => {
      const thenCb = jest.fn()
      const p = new AnalyticsBuffered(() => {
        return Promise.reject('nope') as any
      })
        .then(() => {
          thenCb()
        })
        .catch((err) => {
          expect(err).toBe('nope')
        })
      expect(thenCb).not.toBeCalled()
      expect.assertions(2)
      return p
    })
  })
})

describe(callAnalyticsMethod, () => {
  let ajs!: Analytics
  let resolveSpy!: jest.Mock<any, any>
  let rejectSpy!: jest.Mock<any, any>
  let methodCall!: PreInitMethodCall
  beforeEach(() => {
    resolveSpy = jest.fn().mockImplementation((el) => `resolved: ${el}`)
    rejectSpy = jest.fn().mockImplementation((el) => `rejected: ${el}`)
    methodCall = new PreInitMethodCall(
      'track',
      ['foo', {}],
      resolveSpy,
      rejectSpy
    )
    ajs = new Analytics({
      writeKey: 'abc',
    })
  })
  it('should change called to true', async () => {
    methodCall.called = false
    await callAnalyticsMethod(ajs, methodCall)
    expect(methodCall.called).toBe(true)
  })
  it('should  resolve if an async method is called, like track', async () => {
    await callAnalyticsMethod(ajs, methodCall)
    expect(resolveSpy).toBeCalled()
  })

  it('should not defer if a synchronous method is called, like "on"', () => {
    void callAnalyticsMethod(ajs, {
      ...methodCall,
      method: 'on',
      args: ['foo', jest.fn],
    })
    expect(resolveSpy).toBeCalled()
  })
  describe('error handling', () => {
    it('will catch a promise rejection for async functions', async () => {
      const genericError = new Error('An Error')
      jest.spyOn(ajs, 'track').mockImplementationOnce(() => {
        return Promise.reject(genericError)
      })
      await callAnalyticsMethod(ajs, {
        ...methodCall,
        method: 'track',
      } as PreInitMethodCall<'track'>)

      expect(methodCall.resolve).not.toHaveBeenCalled()
      expect(methodCall.reject).toBeCalledWith(genericError)
    })

    it('will catch any thrown errors for a non-async functions', () => {
      const genericError = new Error('An Error')
      jest.spyOn(ajs, 'on').mockImplementationOnce(() => {
        throw genericError
      })
      void callAnalyticsMethod(ajs, {
        ...methodCall,
        method: 'on',
        args: ['foo', jest.fn()],
      } as PreInitMethodCall<'on'>)

      expect(methodCall.resolve).not.toHaveBeenCalled()
      expect(methodCall.reject).toBeCalledWith(genericError)
    })
  })

  it('should not resolve and return undefined if previously called', async () => {
    methodCall.called = true
    const result = await callAnalyticsMethod(ajs, methodCall)
    expect(resolveSpy).not.toBeCalled()
    expect(result).toBeUndefined()
  })
})

describe(flushAnalyticsCallsInNewTask, () => {
  test('should defer buffered method calls, regardless of whether or not they are async', async () => {
    // @ts-ignore
    Analytics.prototype['synchronousMethod'] = () => 123

    // @ts-ignore
    Analytics.prototype['asyncMethod'] = () => Promise.resolve(123)

    const synchronousMethod = new PreInitMethodCall(
      'synchronousMethod' as any,
      ['foo'],
      jest.fn(),
      jest.fn()
    )

    const asyncMethod = new PreInitMethodCall(
      'asyncMethod' as any,
      ['foo'],
      jest.fn(),
      jest.fn()
    )

    const buffer = new PreInitMethodCallBuffer(synchronousMethod, asyncMethod)
    flushAnalyticsCallsInNewTask(new Analytics({ writeKey: 'abc' }), buffer)
    expect(synchronousMethod.resolve).not.toBeCalled()
    expect(asyncMethod.resolve).not.toBeCalled()
    await sleep(0)
    expect(synchronousMethod.resolve).toBeCalled()
    expect(asyncMethod.resolve).toBeCalled()
  })

  test('should handle promise rejections', async () => {
    // @ts-ignore
    Analytics.prototype['asyncMethod'] = () => Promise.reject('oops!')

    const asyncMethod = new PreInitMethodCall(
      'asyncMethod' as any,
      ['foo'],
      jest.fn(),
      jest.fn()
    )

    const buffer = new PreInitMethodCallBuffer(asyncMethod)
    flushAnalyticsCallsInNewTask(new Analytics({ writeKey: 'abc' }), buffer)
    await sleep(0)
    expect(asyncMethod.reject).toBeCalledWith('oops!')
  })

  test('a thrown error by a synchronous method should not terminate the queue', async () => {
    // @ts-ignore
    Analytics.prototype['asyncMethod'] = () => Promise.resolve(123)

    // @ts-ignore
    Analytics.prototype['synchronousMethod'] = () => {
      throw new Error('Ooops!')
    }

    const synchronousMethod = new PreInitMethodCall(
      'synchronousMethod' as any,
      ['foo'],
      jest.fn(),
      jest.fn()
    )
    const asyncMethod = new PreInitMethodCall(
      'asyncMethod' as any,
      ['foo'],
      jest.fn(),
      jest.fn()
    )

    const buffer = new PreInitMethodCallBuffer(synchronousMethod, asyncMethod)
    buffer.push(synchronousMethod, asyncMethod)
    flushAnalyticsCallsInNewTask(new Analytics({ writeKey: 'abc' }), buffer)
    await sleep(0)
    expect(synchronousMethod.reject).toBeCalled()
    expect(asyncMethod.resolve).toBeCalled()
  })
})
