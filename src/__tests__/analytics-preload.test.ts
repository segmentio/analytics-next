import { AnalyticsBuffered } from '../analytics-preload'
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
