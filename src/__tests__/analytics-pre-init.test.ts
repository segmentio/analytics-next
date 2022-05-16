import {
  AnalyticsBuffered,
  callAnalyticsMethod,
  PreInitMethodCall,
  flushAnalyticsCallsInNewTask,
  PreInitMethodCallBuffer,
} from '../analytics-pre-init'
import { Analytics } from '../analytics'
import { Context } from '../core/context'
import { sleep } from './test-helpers/sleep'

describe('buffered class', () => {
  describe('success', () => {
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

    it('should convert to a promise on await', async () => {
      const ajs = new Analytics({ writeKey: 'foo' })
      const ctx = new Context({ type: 'track' })
      const [analytics, context] = await new AnalyticsBuffered(() => {
        return Promise.resolve<[Analytics, Context]>([ajs, ctx])
      })

      expect(analytics).toEqual(ajs)
      expect(context).toEqual(ctx)
    })
  })

  describe('errors', () => {
    it('should handle a thrown error error', async () => {
      expect(() => {
        void new AnalyticsBuffered(() => {
          throw new Error('oops')
        })
      }).toThrow('oops')
    })
    it('should handle a promise rejection', () => {
      new AnalyticsBuffered(() => Promise.reject('cannot insantiate')).catch(
        (err) => {
          expect(err).toBe('cannot insantiate')
          return err
        }
      )
      expect.assertions(1)
    })
    it('should handle mixed rejection', (done) => {
      new AnalyticsBuffered(() => {
        return Promise.reject('nope') as any
      })
        .then((el) => el)
        .catch((err) => {
          expect(err).toBe('nope')
          done()
        })
    })
    it('should handle chained rejection', (done) => {
      new AnalyticsBuffered(() => {
        return Promise.reject('nope') as any
      })
        .then(() => {
          return 1
          // throw new Error('fail')
        })
        .catch((err) => {
          expect(err).toBe('nope')
          done()
        })
    })
  })
})

{
  /* Type definintion tests */
  ;async () => {
    {
      /* TEST: AnalyticsBuffered should return the correct type if awaited on */

      // @ts-expect-error
      await new AnalyticsBuffered(() => null)

      const [analytics, context] = await new AnalyticsBuffered(
        () => undefined as unknown as Promise<[Analytics, Context]>
      )

      const f: Analytics = analytics
      // @ts-expect-error
      analytics._SHOULD_ERR // check for any

      const c: Context = context
      // @ts-expect-error
      c.SHOULD_ERR // check for any

      console.log(f, c)
    }
    {
      void new AnalyticsBuffered(
        () => undefined as unknown as Promise<[Analytics, Context]>
      )
        .then(([analytics, context]) => {
          // @ts-expect-error
          analytics._SHOULD_ERR
          // @ts-expect-error
          context._SHOULD_ERR

          const f: Analytics = analytics
          // @ts-expect-error
          analytics._SHOULD_ERR // check for any

          const c: Context = context
          // @ts-expect-error
          c.SHOULD_ERR // check for any

          console.log(f, c)
        })
        .then(() => {
          return 'a String!'
        })
        .then((str) => {
          /* TEST:  chaining multiple .thens should preserve type info */
          // @ts-expect-error
          str.SHOULD_ERR // check for any

          const aString: string = str

          console.log(aString)
        })
    }
    {
      /* TEST: if catch is before "then" in the middleware chain, should preserve type info */
      void new AnalyticsBuffered(
        () => undefined as unknown as Promise<[Analytics, Context]>
      )
        .catch((reason) => {
          console.log(reason.SHOULD_NOT_ERR) // should be "any"
          return 'a String'
        })
        .then((response) => {
          const f: string | [Analytics, Context] = response // should return a union of either the "catch response" or "Analytics response"
          console.log(f)
        })
    }
  }
}

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
  afterEach(() => {
    jest.clearAllMocks()
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

    const buffer = new PreInitMethodCallBuffer([synchronousMethod, asyncMethod])

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

    const buffer = new PreInitMethodCallBuffer([asyncMethod])
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

    const buffer = new PreInitMethodCallBuffer([synchronousMethod, asyncMethod])
    flushAnalyticsCallsInNewTask(new Analytics({ writeKey: 'abc' }), buffer)
    await sleep(0)
    expect(synchronousMethod.reject).toBeCalled()
    expect(asyncMethod.resolve).toBeCalled()
  })
})
