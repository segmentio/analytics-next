import { AnalyticsBuffered } from '../analytics-pre-init'
import { Analytics } from '../analytics'
import { Context } from '../core/context'

const analyticsLoadRes = Promise.resolve<[Analytics, Context]>([
  { addIntegration: 'foo' } as any,
  { logger: 'bar' } as any,
])

describe('buffered class', () => {
  describe('success', () => {
    it('should handle a success', async () => {
      const buffered = new AnalyticsBuffered(() => analyticsLoadRes)

      expect(buffered).not.toBeInstanceOf(Promise)
      expect(typeof buffered.addDestinationMiddleware).toBe('function')
    })

    it('should handle a success', async () => {
      const buffered = new AnalyticsBuffered(() => analyticsLoadRes)

      expect(buffered).not.toBeInstanceOf(Promise)
      expect(typeof buffered.addDestinationMiddleware).toBe('function')
    })

    it('should convert to a promise on await', async () => {
      const [analytics, context] = await new AnalyticsBuffered(() => {
        return analyticsLoadRes
      })

      expect(typeof analytics.addIntegration).toBeDefined()
      expect(typeof context.logger).toBeDefined()
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
