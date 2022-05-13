import {
  AnalyticsBuffered,
  callAnalyticsMethod,
  PreInitMethodCall,
} from '../analytics-pre-init'
import { Analytics } from '../analytics'
import { Context } from '../core/context'

const mockAjs = new Analytics({ writeKey: 'foo' })
const mockCtx = new Context({ type: 'track' })
const mockAjsRes = Promise.resolve<[Analytics, Context]>([mockAjs, mockCtx])

describe('buffered class', () => {
  describe('success', () => {
    it('should return a promise-like object', async () => {
      const buffered = new AnalyticsBuffered(() => mockAjsRes)
      expect(buffered).toBeInstanceOf(AnalyticsBuffered)
      expect(typeof buffered.then).toBe('function')
      expect(typeof buffered.catch).toBe('function')
      expect(typeof buffered.finally).toBe('function')
    })

    it('should convert to a promise on await', async () => {
      const [analytics, context] = await new AnalyticsBuffered(() => {
        return mockAjsRes
      })

      expect(analytics).toEqual(mockAjs)
      expect(context).toEqual(mockCtx)
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
    it('should be capable of catching errors for async functions', async () => {
      jest.spyOn(ajs, 'track').mockImplementationOnce(() => {
        return Promise.reject('foo')
      })

      methodCall.reject = jest.fn()
      try {
        await callAnalyticsMethod(ajs, methodCall as PreInitMethodCall<'track'>)
        throw 'fail test'
      } catch (err) {
        expect(methodCall.reject).toHaveBeenCalledWith('foo')
        expect(methodCall.resolve).not.toBeCalled()
      }
    })

    it('should be capable of catching errors for non-async functions', async () => {
      jest.spyOn(ajs, 'on').mockImplementationOnce(() => {
        throw 'foo'
      })

      methodCall.reject = jest.fn()
      try {
        await callAnalyticsMethod(ajs, {
          ...methodCall,
          method: 'on',
          args: ['foo', jest.fn()],
        } as PreInitMethodCall<'on'>)
        throw 'fail test'
      } catch (err) {
        expect(methodCall.reject).toHaveBeenCalledWith('foo')
        expect(methodCall.resolve).not.toBeCalled()
      }
    })
  })

  it('should not resolve and return undefined if previously called', async () => {
    methodCall.called = true
    const result = await callAnalyticsMethod(ajs, methodCall)
    expect(resolveSpy).not.toBeCalled()
    expect(result).toBeUndefined()
  })
})
