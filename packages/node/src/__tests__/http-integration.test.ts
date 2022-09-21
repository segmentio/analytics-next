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
    expect(httpRes.headers['User-Agent']).toBe('analytics-node-next/latest')
    expect(httpRes.headers['Content-Type']).toBe('application/json')
    expect(httpRes.headers['Authorization']).toBeTruthy()
    expect(httpRes.method).toBe('POST')
    expect(url).toBe('https://api.segment.io/v1/identify')

    const body: NodeSegmentEvent = JSON.parse(httpRes.body)
    expect(body.integrations).toEqual({})
    expect(body.messageId).toEqual(expect.stringContaining('ajs-next'))
    expect(body.type).toBe('identify')
    expect(body.traits).toEqual({ foo: 'bar' })
    expect(body.userId).toBe('my_user_id')
    expect(typeof body.timestamp).toBe('string')
    expect(body.context).toEqual({
      library: { name: 'analytics-node-next', version: '0.0.0' },
    })
  })

  test('Track: Fires http requests to the correct endoint', async () => {
    ajs.track({ event: 'track', userId: 'foo' })
    ajs.track({ event: 'track', userId: 'foo', properties: { foo: 'bar' } })
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
