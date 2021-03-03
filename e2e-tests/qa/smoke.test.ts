import flat from 'flat'
import { difference, intersection, without } from 'lodash'
import { JSONValue } from '../../src/core/events'
import { run } from './runner'
import { objectSchema } from './schema'
import { startLocalServer } from './server'
import { sources } from './__fixtures__/sources'

type RemovePromise<T> = T extends Promise<infer U> ? U : T

let url: string

jest.setTimeout(100000)

beforeAll(async () => {
  url = await startLocalServer()
})

describe('Smoke Tests', () => {
  const allResults: Record<string, RemovePromise<ReturnType<typeof run>>> = {}

  beforeAll(async () => {
    // needs to be written as a string so it's not transpiled
    const code = `(async () => {
      await window.analytics.identify('Test', {
        email: 'test@mctesting.org',
      })

      await window.analytics.track('Track!', {
        leProp: 'propé',
      })

      await window.analytics.page()
    })()`

    await Promise.all(
      sources.map(async (writekey) => {
        const res = await run(url, writekey, code)
        allResults[writekey] = res
      })
    )
  })

  sources.forEach((source) => {
    describe(source, () => {
      let results: RemovePromise<ReturnType<typeof run>>

      beforeAll(() => {
        results = allResults[source]
      })

      test('send requests to third parties', () => {
        const classicReqs = results.classic.networkRequests
          .map((n) => new URL(n.url).host)
          .sort()

        const nextReqs = results.next.networkRequests
          .map((n) => new URL(n.url).host)
          .sort()

        expect(nextReqs).not.toEqual([])
        const missing = difference(classicReqs, nextReqs)

        expect(missing).toEqual([])
        expect(nextReqs).toEqual(expect.arrayContaining(classicReqs))
      })

      test('sets the same cookies', () => {
        const nextCookies = results.next.cookies.reduce((all, cookie) => {
          return {
            ...all,
            [cookie.name]: cookie.value,
          }
        }, {} as Record<string, string>)

        const classicCookies = results.classic.cookies.reduce((all, cookie) => {
          return {
            ...all,
            [cookie.name]: cookie.value,
          }
        }, {} as Record<string, string>)

        expect(nextCookies['ajs_user_id']).toContain('Test')
        expect(classicCookies['ajs_user_id']).toContain('Test')
      })

      test('stores traits in local storage', () => {
        const next = results.next.localStorage
        const classic = results.next.localStorage

        expect(next).not.toEqual({})
        expect(Object.keys(next)).toEqual(
          expect.objectContaining(Object.keys(classic))
        )

        expect(next['ajs_user_traits']).toEqual(classic['ajs_user_traits'])
        expect(JSON.parse(next['ajs_user_traits'] as string))
          .toMatchInlineSnapshot(`
            Object {
              "email": "test@mctesting.org",
            }
          `)
      })

      test('sends an event into Segment with the same schema', () => {
        const classicReqs = results.classic.networkRequests
          .filter((n) => n.url.includes('api.segment') && !n.url.endsWith('/m'))
          .sort()

        const nextReqs = results.next.networkRequests
          .filter((n) => n.url.includes('api.segment') && !n.url.endsWith('/m'))
          .sort()

        expect(nextReqs.length).toEqual(classicReqs.length)

        nextReqs.forEach((req, index) => {
          const classic = classicReqs[index]

          expect(req.url).toEqual(classic.url)

          // @ts-ignore need all sources to be rebuilt first
          delete classic.data._metadata.bundledIds

          expect(req.data).toContainSchema(classic.data)

          const nextSchema = objectSchema(req.data as object)
          const classicSchema = objectSchema(classic.data as object)

          const intersectionKeys = without(
            intersection(nextSchema, classicSchema),

            // These are different on purpose
            'context.library.name',
            'context.library.version',

            // We use the same website with a slightly different URL
            'context.page.search',
            'properties.search',
            'context.page.url',
            'properties.url',

            'messageId',
            'anonymousId'
          )

          const flatNext = flat(req.data) as Record<string, JSONValue>
          const flatClassic = flat(classic.data) as Record<string, JSONValue>

          intersectionKeys.forEach((key) => {
            const comparison = {
              url: req.url,
              key,
              next: flatNext[key],
              classic: flatClassic[key],
            }

            expect({ ...comparison, val: comparison.next }).toEqual({
              ...comparison,
              val: comparison.classic,
            })
          })
        })
      })
    })
  })
})
