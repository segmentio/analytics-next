// I found both of these test files, and there doesn't seem to be a difference.
import { resolveCtx } from './test-helpers/resolve-ctx'

const fetcher = jest.fn()
jest.mock('node-fetch', () => fetcher)

import { AnalyticsNode } from '..'

const myDate = new Date('2016')
const _Date = Date

describe('Analytics Node', () => {
  let ajs: AnalyticsNode

  beforeEach(async () => {
    jest.resetAllMocks()

    ajs = new AnalyticsNode({
      writeKey: 'abc123',
    })

    // @ts-ignore
    global.Date = jest.fn(() => myDate)
    /* eslint-disable @typescript-eslint/unbound-method */
    global.Date.UTC = _Date.UTC
    global.Date.parse = _Date.parse
    global.Date.now = _Date.now
  })

  test('fireEvent instantiates the right event types', async () => {
    ajs.identify('identify')
    await resolveCtx(ajs, 'identify')

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.segment.io/v1/identify',
      expect.anything()
    )

    ajs.track(
      'track',
      {},
      {
        anonymousId: 'foo',
      }
    )
    await resolveCtx(ajs, 'track')
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.segment.io/v1/track',
      expect.anything()
    )

    ajs.page(
      'page',
      {},
      {
        anonymousId: 'foo',
      }
    )
    await resolveCtx(ajs, 'page')
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.segment.io/v1/page',
      expect.anything()
    )

    ajs.group('group', {}, { anonymousId: 'foo' })
    await resolveCtx(ajs, 'group')
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.segment.io/v1/group',
      expect.anything()
    )

    ajs.alias('alias', 'previous')
    await resolveCtx(ajs, 'alias')
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.segment.io/v1/alias',
      expect.anything()
    )

    ajs.screen('screen', {}, { anonymousId: 'foo' })
    await resolveCtx(ajs, 'screen')
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.segment.io/v1/screen',
      expect.anything()
    )
  })
})
