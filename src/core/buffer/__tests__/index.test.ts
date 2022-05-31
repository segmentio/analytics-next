import {
  AnalyticsBuffered,
  callAnalyticsMethod,
  PreInitMethodCall,
  flushAnalyticsCallsInNewTask,
  PreInitMethodCallBuffer,
} from '..'
import { Analytics } from '../../analytics'
import { Context } from '../../context'
import { sleep } from '@/test-helpers/sleep'

describe('PreInitMethodCallBuffer', () => {
  describe('push', () => {
    it('should return this', async () => {
      const buffer = new PreInitMethodCallBuffer()
      const result = buffer.push({} as any)
      expect(result).toBeInstanceOf(PreInitMethodCallBuffer)
    })
  })
  describe('toArray should return an array', () => {
    it('toArray() should convert the map back to an array', async () => {
      const buffer = new PreInitMethodCallBuffer()
      const method1 = { method: 'foo' } as any
      const method2 = { method: 'foo', args: [1] } as any
      const method3 = { method: 'bar' } as any
      buffer.push(method1, method2, method3)
      expect(buffer.toArray()).toEqual([method1, method2, method3])
    })
  })

  describe('clear', () => {
    it('should return this', async () => {
      const buffer = new PreInitMethodCallBuffer()
      const result = buffer.push({} as any)
      expect(result).toBeInstanceOf(PreInitMethodCallBuffer)
    })
  })
  describe('getCalls', () => {
    it('should return calls', async () => {
      const buffer = new PreInitMethodCallBuffer()

      const fooCall1 = {
        method: 'foo',
        args: ['bar'],
      } as any

      const barCall = {
        method: 'bar',
        args: ['foobar'],
      } as any

      const fooCall2 = {
        method: 'foo',
        args: ['baz'],
      } as any

      const calls: PreInitMethodCall<any>[] = [fooCall1, fooCall2, barCall]
      const result = buffer.push(...calls)
      expect(result.getCalls('foo' as any)).toEqual([fooCall1, fooCall2])
    })
  })
})

describe('AnalyticsBuffered', () => {
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
      new AnalyticsBuffered(() => {
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
    })
  })
})

describe('callAnalyticsMethod', () => {
  let ajs!: Analytics
  let resolveSpy!: jest.Mock<any, any>
  let rejectSpy!: jest.Mock<any, any>
  let methodCall!: PreInitMethodCall
  beforeEach(() => {
    resolveSpy = jest.fn().mockImplementation((el) => `resolved: ${el}`)
    rejectSpy = jest.fn().mockImplementation((el) => `rejected: ${el}`)
    methodCall = {
      args: ['foo', {}],
      called: false,
      method: 'track',
      resolve: resolveSpy,
      reject: rejectSpy,
    } as PreInitMethodCall

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

describe('flushAnalyticsCallsInNewTask', () => {
  test('should defer buffered method calls, regardless of whether or not they are async', async () => {
    // @ts-ignore
    Analytics.prototype['synchronousMethod'] = () => 123

    // @ts-ignore
    Analytics.prototype['asyncMethod'] = () => Promise.resolve(123)

    const synchronousMethod = {
      method: 'synchronousMethod' as any,
      args: ['foo'],
      called: false,
      resolve: jest.fn(),
      reject: jest.fn(),
    } as PreInitMethodCall<any>

    const asyncMethod = {
      method: 'asyncMethod' as any,
      args: ['foo'],
      called: false,
      resolve: jest.fn(),
      reject: jest.fn(),
    } as PreInitMethodCall<any>

    const buffer = new PreInitMethodCallBuffer().push(
      synchronousMethod,
      asyncMethod
    )

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

    const asyncMethod = {
      method: 'asyncMethod' as any,
      args: ['foo'],
      called: false,
      resolve: jest.fn(),
      reject: jest.fn(),
    } as PreInitMethodCall<any>

    const buffer = new PreInitMethodCallBuffer().push(asyncMethod)
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

    const synchronousMethod = {
      method: 'synchronousMethod' as any,
      args: ['foo'],
      called: false,
      resolve: jest.fn(),
      reject: jest.fn(),
    } as PreInitMethodCall<any>

    const asyncMethod = {
      method: 'asyncMethod' as any,
      args: ['foo'],
      called: false,
      resolve: jest.fn(),
      reject: jest.fn(),
    } as PreInitMethodCall<any>

    const buffer = new PreInitMethodCallBuffer().push(
      synchronousMethod,
      asyncMethod
    )
    flushAnalyticsCallsInNewTask(new Analytics({ writeKey: 'abc' }), buffer)
    await sleep(0)
    expect(synchronousMethod.reject).toBeCalled()
    expect(asyncMethod.resolve).toBeCalled()
  })
})
