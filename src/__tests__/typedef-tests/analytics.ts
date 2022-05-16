import { Analytics } from '@/analytics'
import { AnalyticsBuffered } from '@/analytics-pre-init'
import { Context } from '@/core/context'
import { AnalyticsBrowser } from '../../browser'
import { assertNotAny, assertIs } from '../test-helpers/type-assertions'

/**
 * These are general typescript definition tests;
 * They aren't meant to be run by anything but the typescript compiler.
 */
export default {
  'Analytics should return AnalyticsBuffered': () => {
    const result = AnalyticsBrowser.load({ writeKey: 'abc' })
    assertNotAny(result)
    assertIs<AnalyticsBuffered>(result)
  },
  'AnalyticsBuffered should return Promise<[Analytics, Context]> if awaited on.':
    async () => {
      // @ts-expect-error
      await new AnalyticsBuffered(() => null)

      const [analytics, context] = await new AnalyticsBuffered(
        () => undefined as unknown as Promise<[Analytics, Context]>
      )

      assertNotAny(analytics)
      assertIs<Analytics>(analytics)

      assertNotAny(context)
      assertIs<Context>(context)
    },
  'Promise API should work': () => {
    void new AnalyticsBuffered(
      () => undefined as unknown as Promise<[Analytics, Context]>
    )
      .then(([analytics, context]) => {
        assertNotAny(analytics)
        assertIs<Analytics>(analytics)

        assertNotAny(context)
        assertIs<Context>(context)
      })
      .then(() => {
        return 'a String!' as const
      })
      .then((str) => {
        assertNotAny(str)
        assertIs<'a String!'>(str)
      })
  },
  'If catch is before "then" in the middleware chain, .then should take into account the catch clause':
    () => {
      void new AnalyticsBuffered(
        () => undefined as unknown as Promise<[Analytics, Context]>
      )
        .catch((err: string) => {
          assertIs<string>(err)
          return 123
        })
        .then((response) => {
          assertNotAny(response)
          assertIs<number | [Analytics, Context]>(response)
        })
    },
}
