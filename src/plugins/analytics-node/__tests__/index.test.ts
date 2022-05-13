const fetcher = jest.fn()
jest.mock('node-fetch', () => fetcher)

import { load, AnalyticsNodeJs } from '../../../node'

const myDate = new Date('2016')
const _Date = Date

describe('Analytics Node', () => {
  let ajs: AnalyticsNodeJs

  beforeEach(async () => {
    jest.resetAllMocks()

    const [analytics] = await load({
      writeKey: 'abc123',
    })

    ajs = analytics

    // @ts-ignore
    global.Date = jest.fn(() => myDate)
    /* eslint-disable @typescript-eslint/unbound-method */
    global.Date.UTC = _Date.UTC
    global.Date.parse = _Date.parse
    global.Date.now = _Date.now
  })

  describe('AJS', () => {
    test('fireEvent instantiates the right event types', async () => {
      try {
        await ajs.track(
          'track',
          {},
          {
            anonymousId: 'foo',
          }
        )
      } catch (err) {
        console.log(err)
      }
      expect(fetcher).toHaveBeenCalledWith(
        'https://api.segment.io/v1/track',
        expect.anything()
      )

      await ajs.identify('identify')
      expect(fetcher).toHaveBeenCalledWith(
        'https://api.segment.io/v1/identify',
        expect.anything()
      )

      await ajs.page(
        'page',
        {},
        {
          anonymousId: 'foo',
        }
      )
      expect(fetcher).toHaveBeenCalledWith(
        'https://api.segment.io/v1/page',
        expect.anything()
      )

      await ajs.group('group', {}, { anonymousId: 'foo' })
      expect(fetcher).toHaveBeenCalledWith(
        'https://api.segment.io/v1/group',
        expect.anything()
      )

      await ajs.alias('alias', 'previous')
      expect(fetcher).toHaveBeenCalledWith(
        'https://api.segment.io/v1/alias',
        expect.anything()
      )

      await ajs.screen('screen', {}, { anonymousId: 'foo' })
      expect(fetcher).toHaveBeenCalledWith(
        'https://api.segment.io/v1/screen',
        expect.anything()
      )
    })
  })
})
