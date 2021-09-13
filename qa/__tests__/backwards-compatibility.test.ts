import { difference } from 'lodash'
import { browser } from '../lib/browser'
import { run } from '../lib/runner'
import { server } from '../lib/server'
import { TEST_WRITEKEY } from '../../src/__tests__/test-writekeys'

describe('Backwards compatibility', () => {
  test('provides all same properties', async () => {
    const code = `(() => {
      return [
        ...new Set([
          ...Object.getOwnPropertyNames(Object.getPrototypeOf(window.analytics)),
          ...Object.getOwnPropertyNames(window.analytics)
        ])
      ].sort()
    })()`

    const results = await run({
      browser: await browser(),
      script: code,
      serverURL: await server(),
      writeKey: TEST_WRITEKEY,
    })

    const next = results.next.codeEvaluation as string[]
    const classic = results.classic.codeEvaluation as string[]

    const missing = difference(classic, next).filter(
      (fn) =>
        !fn.startsWith('_') &&
        // These are inherited through Emitter
        !['emit', 'off', 'on', 'once', 'require'].includes(fn)
    )
    expect(missing).toEqual([])
  })

  test('accesses user_id the same way', async () => {
    const code = `(async () => {
      await analytics.identify('Test User')
      return analytics.user().id()
    })()`

    const results = await run({
      browser: await browser(),
      script: code,
      serverURL: await server(),
      writeKey: TEST_WRITEKEY,
    })

    const nextId = results.next.codeEvaluation
    const classicId = results.classic.codeEvaluation

    expect(nextId).toEqual(classicId)
    expect(nextId).not.toBeFalsy()
  })

  test('accesses traits the same way', async () => {
    const code = `(async () => {
      await analytics.identify('Test User', { email: 'test@example.org' })
      return analytics.user().traits()
    })()`

    const results = await run({
      browser: await browser(),
      script: code,
      serverURL: await server(),
      writeKey: TEST_WRITEKEY,
    })

    const nextId = results.next.codeEvaluation as { email: string }
    const classicId = results.classic.codeEvaluation as { email: string }

    expect(nextId).toEqual(classicId)
    expect(nextId.email).toEqual('test@example.org')
  })

  test('loads bundles from custom domain CDN', async () => {
    const code = `(async () => {})()`

    const result = await run({
      browser: await browser(),
      script: code,
      serverURL: await server(),
      writeKey: TEST_WRITEKEY,
    })

    const resultString = result.next.bundleRequests.join()

    expect(resultString).toContain(
      'http://localhost:4000/dist/umd/standalone.js'
    )
    expect(resultString).toContain(
      'http://localhost:4000/dist/umd/vendors-node_modules_segment_tsub_dist_index_js.bundle'
    )
    expect(resultString).toContain(
      'http://localhost:4000/dist/umd/ajs-destination.bundle'
    )
    expect(resultString).toContain(
      'http://localhost:4000/dist/umd/legacyVideos.bundle'
    )
    expect(resultString).toContain(
      'http://localhost:4000/dist/umd/vendors-node_modules_segment_analytics_js-video-plugins_dist_index_umd_js.bundle'
    )
  })

  test('event emitters emit the same properties', async () => {
    const code = `(async () => {
      let allEvents = {}
      const analytics = window.analytics

      analytics.on('page', (...args) => {
        allEvents['page'] = [...args].filter(a => a !== undefined && Object.keys(a ?? {}).length > 0)
      })

      analytics.on('track', (...args) => {
        allEvents['track'] = [...args].filter(a => a !== undefined && Object.keys(a ?? {}).length > 0)
      })

      analytics.on('identify', (...args) => {
        allEvents['identify'] = [...args].filter(a => a !== undefined && Object.keys(a ?? {}).length > 0)
      })

      await analytics.page()
      await analytics.identify('Hasbulla', { goat: true })
      await analytics.track('hello world')

      return allEvents
    })()`

    const result = await run({
      browser: await browser(),
      script: code,
      serverURL: await server(),
      writeKey: TEST_WRITEKEY,
    })

    const classic = result.classic.codeEvaluation
    const next = result.next.codeEvaluation

    expect(next['track']).toEqual(classic['track'])
    expect(next['identify']).toEqual(classic['identify'])

    expect(classic['page']).toMatchInlineSnapshot(`
      Array [
        Object {
          "path": "/",
          "referrer": "",
          "search": "?type=classic&wk=D8frB7upBChqDN9PMWksNvZYDaKJIYo6",
          "title": "",
          "url": "http://localhost:4000/?type=classic&wk=D8frB7upBChqDN9PMWksNvZYDaKJIYo6",
        },
        Object {
          "context": Object {
            "page": Object {
              "path": "/",
              "referrer": "",
              "search": "?type=classic&wk=D8frB7upBChqDN9PMWksNvZYDaKJIYo6",
              "title": "",
              "url": "http://localhost:4000/?type=classic&wk=D8frB7upBChqDN9PMWksNvZYDaKJIYo6",
            },
          },
        },
      ]
    `)

    const pagecallback = next['page']

    expect(pagecallback[0]).toEqual(
      expect.objectContaining({
        ...classic['page'][0],
        search: '?type=next&wk=D8frB7upBChqDN9PMWksNvZYDaKJIYo6',
        url:
          'http://localhost:4000/?type=next&wk=D8frB7upBChqDN9PMWksNvZYDaKJIYo6',
      })
    )
  })
})
