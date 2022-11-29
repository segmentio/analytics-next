import { version } from '../../package.json'
import { Analytics } from '..'
import { resolveCtx } from './test-helpers/resolve-ctx'
import { createTestAnalytics } from './test-helpers/create-test-analytics'
import { isValidDate } from './test-helpers/is-valid-date'
import { pick, omit } from 'lodash'
import nock from 'nock'

const snapshotMatchers = {
  get batchEvent() {
    return {
      messageId: expect.any(String),
      context: {
        library: {
          version: expect.any(String),
        },
      },

      _metadata: {
        nodeVersion: expect.any(String),
      },
      timestamp: expect.any(String),
    }
  },
  get defaultReqBody() {
    return { batch: [snapshotMatchers.batchEvent] }
  },
  get defaultReqBodyWithoutTimestamp() {
    return { batch: [omit(snapshotMatchers.batchEvent, 'timestamp')] }
  },
}

describe('Method Smoke Tests', () => {
  let ajs: Analytics
  let scope: nock.Scope

  beforeEach(async () => {
    nock.cleanAll()
    ajs = createTestAnalytics()
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
              Object {
                "authorization": Array [
                  "Basic Zm9vOg==",
                ],
                "content-type": Array [
                  "application/json",
                ],
                "user-agent": Array [
                  "analytics-node-next/latest",
                ],
              }
          `)
      expect(scope.isDone())
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
    test(`Identify`, async () => {
      ajs.identify({ userId: 'my_user_id', traits: { foo: 'bar' } })
      await resolveCtx(ajs, 'identify')

      expect(scope.isDone()).toBeTruthy()
      expect(calls.length).toBe(1)
      expect(calls[0]).toMatchInlineSnapshot(
        snapshotMatchers.defaultReqBody,
        `
              Object {
                "batch": Array [
                  Object {
                    "_metadata": Object {
                      "nodeVersion": Any<String>,
                    },
                    "context": Object {
                      "library": Object {
                        "name": "AnalyticsNode",
                        "version": Any<String>,
                      },
                    },
                    "integrations": Object {},
                    "messageId": Any<String>,
                    "timestamp": Any<String>,
                    "traits": Object {
                      "foo": "bar",
                    },
                    "type": "identify",
                    "userId": "my_user_id",
                  },
                ],
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
        Object {
          "batch": Array [
            Object {
              "_metadata": Object {
                "nodeVersion": Any<String>,
              },
              "context": Object {
                "library": Object {
                  "name": "AnalyticsNode",
                  "version": Any<String>,
                },
              },
              "event": "foo",
              "integrations": Object {},
              "messageId": Any<String>,
              "properties": Object {
                "hello": "world",
              },
              "timestamp": Any<String>,
              "type": "track",
              "userId": "foo",
            },
          ],
        }
      `
      )
    })

    test('Page', async () => {
      ajs.page({ name: 'page', anonymousId: 'foo' })
      await resolveCtx(ajs, 'page')
      expect(calls[0]).toMatchInlineSnapshot(
        snapshotMatchers.defaultReqBodyWithoutTimestamp,
        `
        Object {
          "batch": Array [
            Object {
              "_metadata": Object {
                "nodeVersion": Any<String>,
              },
              "anonymousId": "foo",
              "context": Object {
                "library": Object {
                  "name": "AnalyticsNode",
                  "version": Any<String>,
                },
              },
              "integrations": Object {},
              "messageId": Any<String>,
              "name": "page",
              "properties": Object {},
              "type": "page",
            },
          ],
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
        Object {
          "batch": Array [
            Object {
              "_metadata": Object {
                "nodeVersion": Any<String>,
              },
              "anonymousId": "foo",
              "context": Object {
                "library": Object {
                  "name": "AnalyticsNode",
                  "version": Any<String>,
                },
              },
              "groupId": "myGroupId",
              "integrations": Object {},
              "messageId": Any<String>,
              "timestamp": Any<String>,
              "traits": Object {
                "some_traits": 123,
              },
              "type": "group",
            },
          ],
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
        Object {
          "batch": Array [
            Object {
              "_metadata": Object {
                "nodeVersion": Any<String>,
              },
              "context": Object {
                "library": Object {
                  "name": "AnalyticsNode",
                  "version": Any<String>,
                },
              },
              "integrations": Object {},
              "messageId": Any<String>,
              "previousId": "previous",
              "timestamp": Any<String>,
              "type": "alias",
              "userId": "alias",
            },
          ],
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
        snapshotMatchers.defaultReqBodyWithoutTimestamp,
        `
        Object {
          "batch": Array [
            Object {
              "_metadata": Object {
                "nodeVersion": Any<String>,
              },
              "anonymousId": "foo",
              "context": Object {
                "library": Object {
                  "name": "AnalyticsNode",
                  "version": Any<String>,
                },
              },
              "integrations": Object {},
              "messageId": Any<String>,
              "name": "screen",
              "properties": Object {
                "title": "wip",
              },
              "type": "screen",
            },
          ],
        }
      `
      )
    })
  })
})
