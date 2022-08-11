import { Analytics } from '@/core/analytics'
import { Context } from '@/core/context'
import { AnalyticsBrowser } from '@/browser'
import { assertNotAny, assertIs } from '@/test-helpers/type-assertions'
import { Group, User } from '../../../core/user'

/**
 * These are general typescript definition tests;
 * They aren't meant to be run by anything but the typescript compiler.
 */
export default {
  'AnalyticsBrowser should return the correct type': () => {
    const result = AnalyticsBrowser.load({ writeKey: 'abc' })
    assertNotAny(result)
    assertIs<AnalyticsBrowser>(result)
  },
  'AnalyticsBrowser should return the correct type if awaited on.':
    async () => {
      const [analytics, context] = await AnalyticsBrowser.load({
        writeKey: 'foo',
      })

      assertNotAny(analytics)
      assertIs<Analytics>(analytics)

      assertNotAny(context)
      assertIs<Context>(context)
    },
  'Promise API should work': () => {
    void AnalyticsBrowser.load({ writeKey: 'foo' })
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
      void AnalyticsBrowser.load({ writeKey: 'foo' })
        .catch((err: string) => {
          assertIs<string>(err)
          return 123
        })
        .then((response) => {
          assertNotAny(response)
          assertIs<number | [Analytics, Context]>(response)
        })
    },

  'Group should have the correct type': () => {
    const ajs = AnalyticsBrowser.load({ writeKey: 'foo' })
    {
      const grpResult = ajs.group()
      assertIs<Promise<Group>>(grpResult)
    }
    {
      const grpResult = ajs.group('foo')
      assertIs<Promise<Context>>(grpResult)
    }
  },
  'User should have the correct type': () => {
    const ajs = AnalyticsBrowser.load({ writeKey: 'foo' })
    {
      const grpResult = ajs.user()
      assertIs<Promise<User>>(grpResult)
    }
  },
  'Identify should work with spread objects ': () => {
    const user = {
      name: 'john',
      id: 12345,
    }
    const { id, ...traits } = user
    void AnalyticsBrowser.load({ writeKey: 'foo' }).identify('foo', traits)
  },
  'Track should work with spread objects': () => {
    const user = {
      name: 'john',
      id: 12345,
    }
    const { id, ...traits } = user
    void AnalyticsBrowser.load({ writeKey: 'foo' }).track('foo', traits)
  },
  'Identify should work with generic objects ': () => {
    const user = {
      name: 'john',
      id: 12345,
    }
    void AnalyticsBrowser.load({ writeKey: 'foo' }).identify('foo', user)
  },
  'Context should have a key allowing arbitrary properties': async () => {
    const [_, ctx] = await AnalyticsBrowser.load({ writeKey: 'foo' })
    const properties = ctx.event.properties!

    properties.category.baz = 'hello'
  },
}
