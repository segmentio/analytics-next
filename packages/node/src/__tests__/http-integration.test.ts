const fetcher = jest.fn()
jest.mock('node-fetch', () => fetcher)

import { createSuccess } from './test-helpers/factories'
import { AnalyticsNode } from '..'
import { NodeSegmentEvent } from '../app/analytics-node'
import { resolveCtx } from './test-helpers/resolve-ctx'

const myDate = new Date('2016')
const _Date = Date

describe('Analytics Node', () => {
  let ajs: AnalyticsNode

  beforeEach(async () => {
    jest.resetAllMocks()
    fetcher.mockReturnValue(createSuccess())

    ajs = new AnalyticsNode({
      writeKey: 'abc123',
    })

    // @ts-ignore
    global.Date = jest.fn(() => myDate)
    global.Date.UTC = _Date.UTC
    global.Date.parse = _Date.parse
    global.Date.now = _Date.now
  })

  test(`Fires an "identify" request with the expected data`, async () => {
    ajs.identify({ userId: 'my_user_id', traits: { foo: 'bar' } })
    await resolveCtx(ajs, 'identify')
    const calls = fetcher.mock.calls
    expect(calls.length).toBe(1)
    const call1 = calls[0]
    const [url, httpRes] = call1
    expect(httpRes.method).toBe('POST')
    expect(url).toBe('https://api.segment.io/v1/identify')
    expect(httpRes.headers).toMatchInlineSnapshot(
      {
        Authorization: expect.stringContaining('Basic'),
        'User-Agent': expect.stringContaining('analytics-node-next'),
      },
      `
      Object {
        "Authorization": StringContaining "Basic",
        "Content-Type": "application/json",
        "User-Agent": StringContaining "analytics-node-next",
      }
    `
    )
    const body: NodeSegmentEvent = JSON.parse(httpRes.body)
    expect(body).toMatchInlineSnapshot(
      {
        messageId: expect.any(String),
        _metadata: {
          nodeVersion: expect.any(String),
        },

        context: {
          library: {
            version: expect.any(String),
          },
        },
      },
      `
      Object {
        "_metadata": Object {
          "nodeVersion": Any<String>,
        },
        "context": Object {
          "library": Object {
            "name": "analytics-node-next",
            "version": Any<String>,
          },
        },
        "integrations": Object {},
        "messageId": Any<String>,
        "timestamp": "2016-01-01T00:00:00.000Z",
        "traits": Object {
          "foo": "bar",
        },
        "type": "identify",
        "userId": "my_user_id",
      }
    `
    )
  })

  test('Track: Fires http requests to the correct endoint', async () => {
    ajs.track({ event: 'foo', userId: 'foo' })
    ajs.track({ event: 'bar', userId: 'foo', properties: { foo: 'bar' } })
    await resolveCtx(ajs, 'track')
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.segment.io/v1/track',
      expect.anything()
    )
  })

  test('Page: Fires http requests to the correct endoint', async () => {
    ajs.page({ name: 'page', anonymousId: 'foo' })
    await resolveCtx(ajs, 'page')
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.segment.io/v1/page',
      expect.anything()
    )
  })

  test('Group: Fires http requests to the correct endoint', async () => {
    ajs.group({ groupId: 'group', anonymousId: 'foo' })
    await resolveCtx(ajs, 'group')
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.segment.io/v1/group',
      expect.anything()
    )
  })

  test('Alias: Fires http requests to the correct endoint', async () => {
    ajs.alias({ userId: 'alias', previousId: 'previous' })
    await resolveCtx(ajs, 'alias')
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.segment.io/v1/alias',
      expect.anything()
    )
  })

  test('Screen', async () => {
    ajs.screen({ name: 'screen', anonymousId: 'foo' })
    await resolveCtx(ajs, 'screen')
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.segment.io/v1/screen',
      expect.anything()
    )
  })
})
