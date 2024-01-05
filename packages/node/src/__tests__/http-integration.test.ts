import { version } from '../generated/version'
import { Analytics } from '..'
import { resolveCtx } from './test-helpers/resolve-ctx'
import { createTestAnalytics } from './test-helpers/create-test-analytics'
import { isValidDate } from './test-helpers/is-valid-date'
import { pick } from 'lodash'
import nock from 'nock'
import { CoreContext } from '@segment/analytics-core'

const isoDateRegEx = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

const snapshotMatchers = {
  get batchEvent() {
    return {
      messageId: expect.any(String),
      context: {
        library: {
          version: expect.any(String),
        },
      },
      _metadata: expect.any(Object),
      timestamp: expect.stringMatching(isoDateRegEx),
    }
  },
  get defaultReqBody() {
    return {
      batch: [snapshotMatchers.batchEvent],
      sentAt: expect.stringMatching(isoDateRegEx),
    }
  },
}

beforeEach(() => {
  nock.cleanAll()
})

describe('Method Smoke Tests', () => {
  let scope: nock.Scope
  let ajs: Analytics
  beforeEach(async () => {
    ajs = createTestAnalytics({}, { useRealHTTPClient: true })
  })

  describe('Metadata', () => {
    const calls: any[] = []
    beforeEach(async () => {
      scope = nock('https://api.segment.io') // using regex matching in nock changes the perf profile quite a bit
        .post('/v1/batch', function (_body: any) {
          calls.push(_body)
          return true
        })
        .reply(201)
    })

    it('should show appropriate metadata', async () => {
      ajs.identify({ userId: 'my_user_id', traits: { foo: 'bar' } })
      await resolveCtx(ajs, 'identify')
      expect(calls[0].batch[0]._metadata).toMatchInlineSnapshot(
        { nodeVersion: expect.any(String), jsRuntime: 'node' },
        `
        {
          "jsRuntime": "node",
          "nodeVersion": Any<String>,
        }
      `
      )
    })
  })

  describe('Headers', () => {
    test(`A request should have the expected headers`, async () => {
      let headers = null
      scope = nock('https://api.segment.io') // using regex matching in nock changes the perf profile quite a bit
        .post('/v1/batch')
        .reply(201, function () {
          headers = this.req.headers
        })
      ajs.identify({ userId: 'my_user_id', traits: { foo: 'bar' } })
      await resolveCtx(ajs, 'identify')

      expect(pick(headers, 'authorization', 'user-agent', 'content-type'))
        .toMatchInlineSnapshot(`
        {
          "authorization": [
            "Basic Zm9vOg==",
          ],
          "content-type": [
            "application/json",
          ],
          "user-agent": [
            "analytics-node-next/latest",
          ],
        }
      `)
      expect(scope.isDone()).toBeTruthy()
    })
  })

  describe('Request Bodies', () => {
    let calls: any[]
    beforeEach(async () => {
      calls = []
      scope = nock('https://api.segment.io') // using regex matching in nock changes the perf profile quite a bit
        .post('/v1/batch', function (_body: any) {
          calls.push(_body)
          return true
        })
        .reply(201)
    })

    test('Generic Properties', async () => {
      const event = {
        event: 'foo',
        userId: 'foo',
        properties: { hello: 'world' },
        integrations: {
          foo: true,
        },
        timestamp: new Date(),
      }

      ajs.track(event)
      await resolveCtx(ajs, 'track')
      const call = calls[0].batch[0]
      expect(call.timestamp).toStrictEqual(event.timestamp.toISOString())
      expect(call.userId).toStrictEqual(event.userId)
      expect(call.integrations).toEqual(event.integrations)
    })

    test(`Identify`, async () => {
      ajs.identify({ userId: 'my_user_id', traits: { foo: 'bar' } })
      await resolveCtx(ajs, 'identify')

      expect(scope.isDone()).toBeTruthy()
      expect(calls.length).toBe(1)
      expect(calls[0]).toMatchInlineSnapshot(
        snapshotMatchers.defaultReqBody,
        `
        {
          "batch": [
            {
              "_metadata": Any<Object>,
              "context": {
                "library": {
                  "name": "@segment/analytics-node",
                  "version": Any<String>,
                },
              },
              "integrations": {},
              "messageId": Any<String>,
              "timestamp": StringMatching /\\^\\\\d\\{4\\}-\\\\d\\{2\\}-\\\\d\\{2\\}T\\\\d\\{2\\}:\\\\d\\{2\\}:\\\\d\\{2\\}\\\\\\.\\\\d\\{3\\}Z\\$/,
              "traits": {
                "foo": "bar",
              },
              "type": "identify",
              "userId": "my_user_id",
            },
          ],
          "sentAt": StringMatching /\\^\\\\d\\{4\\}-\\\\d\\{2\\}-\\\\d\\{2\\}T\\\\d\\{2\\}:\\\\d\\{2\\}:\\\\d\\{2\\}\\\\\\.\\\\d\\{3\\}Z\\$/,
        }
      `
      )

      const event = calls[0].batch[0]
      expect(event.context.library.version).toBe(version)
      expect(isValidDate(event.timestamp)).toBeTruthy()
    })

    test('Track', async () => {
      ajs.track({ event: 'foo', userId: 'foo', properties: { hello: 'world' } })
      await resolveCtx(ajs, 'track')
      expect(calls[0]).toMatchInlineSnapshot(
        snapshotMatchers.defaultReqBody,
        `
        {
          "batch": [
            {
              "_metadata": Any<Object>,
              "context": {
                "library": {
                  "name": "@segment/analytics-node",
                  "version": Any<String>,
                },
              },
              "event": "foo",
              "integrations": {},
              "messageId": Any<String>,
              "properties": {
                "hello": "world",
              },
              "timestamp": StringMatching /\\^\\\\d\\{4\\}-\\\\d\\{2\\}-\\\\d\\{2\\}T\\\\d\\{2\\}:\\\\d\\{2\\}:\\\\d\\{2\\}\\\\\\.\\\\d\\{3\\}Z\\$/,
              "type": "track",
              "userId": "foo",
            },
          ],
          "sentAt": StringMatching /\\^\\\\d\\{4\\}-\\\\d\\{2\\}-\\\\d\\{2\\}T\\\\d\\{2\\}:\\\\d\\{2\\}:\\\\d\\{2\\}\\\\\\.\\\\d\\{3\\}Z\\$/,
        }
      `
      )
    })

    test('Page', async () => {
      ajs.page({ name: 'page', anonymousId: 'foo' })
      await resolveCtx(ajs, 'page')
      expect(calls[0]).toMatchInlineSnapshot(
        snapshotMatchers.defaultReqBody,
        `
        {
          "batch": [
            {
              "_metadata": Any<Object>,
              "anonymousId": "foo",
              "context": {
                "library": {
                  "name": "@segment/analytics-node",
                  "version": Any<String>,
                },
              },
              "integrations": {},
              "messageId": Any<String>,
              "name": "page",
              "properties": {},
              "timestamp": StringMatching /\\^\\\\d\\{4\\}-\\\\d\\{2\\}-\\\\d\\{2\\}T\\\\d\\{2\\}:\\\\d\\{2\\}:\\\\d\\{2\\}\\\\\\.\\\\d\\{3\\}Z\\$/,
              "type": "page",
            },
          ],
          "sentAt": StringMatching /\\^\\\\d\\{4\\}-\\\\d\\{2\\}-\\\\d\\{2\\}T\\\\d\\{2\\}:\\\\d\\{2\\}:\\\\d\\{2\\}\\\\\\.\\\\d\\{3\\}Z\\$/,
        }
      `
      )
    })

    test('Group', async () => {
      ajs.group({
        groupId: 'myGroupId',
        anonymousId: 'foo',
        traits: { some_traits: 123 },
      })
      await resolveCtx(ajs, 'group')
      expect(calls[0]).toMatchInlineSnapshot(
        snapshotMatchers.defaultReqBody,
        `
        {
          "batch": [
            {
              "_metadata": Any<Object>,
              "anonymousId": "foo",
              "context": {
                "library": {
                  "name": "@segment/analytics-node",
                  "version": Any<String>,
                },
              },
              "groupId": "myGroupId",
              "integrations": {},
              "messageId": Any<String>,
              "timestamp": StringMatching /\\^\\\\d\\{4\\}-\\\\d\\{2\\}-\\\\d\\{2\\}T\\\\d\\{2\\}:\\\\d\\{2\\}:\\\\d\\{2\\}\\\\\\.\\\\d\\{3\\}Z\\$/,
              "traits": {
                "some_traits": 123,
              },
              "type": "group",
            },
          ],
          "sentAt": StringMatching /\\^\\\\d\\{4\\}-\\\\d\\{2\\}-\\\\d\\{2\\}T\\\\d\\{2\\}:\\\\d\\{2\\}:\\\\d\\{2\\}\\\\\\.\\\\d\\{3\\}Z\\$/,
        }
      `
      )
    })

    test('Alias', async () => {
      ajs.alias({ userId: 'alias', previousId: 'previous' })
      await resolveCtx(ajs, 'alias')
      expect(calls[0]).toMatchInlineSnapshot(
        snapshotMatchers.defaultReqBody,
        `
        {
          "batch": [
            {
              "_metadata": Any<Object>,
              "context": {
                "library": {
                  "name": "@segment/analytics-node",
                  "version": Any<String>,
                },
              },
              "integrations": {},
              "messageId": Any<String>,
              "previousId": "previous",
              "timestamp": StringMatching /\\^\\\\d\\{4\\}-\\\\d\\{2\\}-\\\\d\\{2\\}T\\\\d\\{2\\}:\\\\d\\{2\\}:\\\\d\\{2\\}\\\\\\.\\\\d\\{3\\}Z\\$/,
              "type": "alias",
              "userId": "alias",
            },
          ],
          "sentAt": StringMatching /\\^\\\\d\\{4\\}-\\\\d\\{2\\}-\\\\d\\{2\\}T\\\\d\\{2\\}:\\\\d\\{2\\}:\\\\d\\{2\\}\\\\\\.\\\\d\\{3\\}Z\\$/,
        }
      `
      )
    })

    test('Screen', async () => {
      ajs.screen({
        name: 'screen',
        anonymousId: 'foo',
        properties: { title: 'wip' },
      })
      await resolveCtx(ajs, 'screen')
      expect(calls[0]).toMatchInlineSnapshot(
        snapshotMatchers.defaultReqBody,
        `
        {
          "batch": [
            {
              "_metadata": Any<Object>,
              "anonymousId": "foo",
              "context": {
                "library": {
                  "name": "@segment/analytics-node",
                  "version": Any<String>,
                },
              },
              "integrations": {},
              "messageId": Any<String>,
              "name": "screen",
              "properties": {
                "title": "wip",
              },
              "timestamp": StringMatching /\\^\\\\d\\{4\\}-\\\\d\\{2\\}-\\\\d\\{2\\}T\\\\d\\{2\\}:\\\\d\\{2\\}:\\\\d\\{2\\}\\\\\\.\\\\d\\{3\\}Z\\$/,
              "type": "screen",
            },
          ],
          "sentAt": StringMatching /\\^\\\\d\\{4\\}-\\\\d\\{2\\}-\\\\d\\{2\\}T\\\\d\\{2\\}:\\\\d\\{2\\}:\\\\d\\{2\\}\\\\\\.\\\\d\\{3\\}Z\\$/,
        }
      `
      )
    })
  })
})

describe('Client: requestTimeout', () => {
  beforeEach(async () => {
    nock('https://api.segment.io') // using regex matching in nock changes the perf profile quite a bit
      .post('/v1/batch')
      .reply(201)
  })
  it('should timeout immediately if request timeout is set to 0', async () => {
    jest.useRealTimers()
    const ajs = createTestAnalytics(
      {
        flushAt: 1,
        httpRequestTimeout: 0,
      },
      { useRealHTTPClient: true }
    )
    ajs.track({ event: 'foo', userId: 'foo', properties: { hello: 'world' } })
    try {
      await resolveCtx(ajs, 'track')
      throw Error('fail test')
    } catch (err: any) {
      expect(err.ctx).toBeInstanceOf(CoreContext)
    }
  })
})
