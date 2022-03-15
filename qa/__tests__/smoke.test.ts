import flat from 'flat'
import { difference, intersection, uniq, without } from 'lodash'
import { JSONValue } from '../../src/core/events'
import { browser } from '../lib/browser'
import { run } from '../lib/runner'
import { objectSchema } from '../lib/schema'
import { server } from '../lib/server'

jest.setTimeout(100000)
type RemovePromise<T> = T extends Promise<infer U> ? U : T

const sources = process.env.QA_SOURCES.split(',')

function compareSchema(results: RemovePromise<ReturnType<typeof run>>) {
  const classicReqs = results.classic.networkRequests
    .filter((n) => n.url.includes('api.segment') && !n.url.endsWith('/m'))
    .sort()

  const nextReqs = results.next.networkRequests
    .filter((n) => n.url.includes('api.segment') && !n.url.endsWith('/m'))
    .sort()

  nextReqs.forEach((req, index) => {
    const classic = classicReqs[index]
    if (!classic) {
      return
    }

    expect(req.url).toEqual(classic.url)

    // @ts-ignore need all sources to be rebuilt first
    if (classic.data?._metadata) {
      // @ts-ignore need all sources to be rebuilt first
      delete classic.data._metadata.bundledIds

      // @ts-ignore sort unbundled metadata because of a breaking change in the SegmentIO destination
      classic.data._metadata.unbundled = uniq(
        // @ts-ignore
        classic.data._metadata.unbundled.sort()
      )
    }

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
}

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

describe('Obfuscated Smoke Tests', () => {
  test.concurrent.each(sources)(`smoke test`, async (writeKey) => {
    const [url, chrome] = await Promise.all([server(true), browser()])
    const results = await run({
      browser: chrome,
      script: code,
      serverURL: url,
      writeKey,
    })

    results.next.bundleRequestFailures.forEach((result) => {
      expect(result).toBe(null)
    })

    compareSchema(results)
  })
})

describe('Smoke Tests', () => {
  test.concurrent.each(sources)(`smoke test`, async (writekey) => {
    const [url, chrome] = await Promise.all([server(), browser()])

    const results = await run({
      browser: chrome,
      script: code,
      serverURL: url,
      writeKey: writekey,
    })

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

    compareSchema(results)
  })
})
