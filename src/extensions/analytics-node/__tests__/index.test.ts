import { hydrateMessage } from '..'
import { Analytics } from '../../../index'
import { AnalyticsNode } from '../../../node'
import { postToTrackingAPI } from '../api'

jest.mock('../api')

const myDate = new Date('2016')
const _Date = Date

describe('Analytics Node', () => {
  let ajs: Analytics

  beforeEach(async () => {
    jest.resetAllMocks()

    const [analytics] = await AnalyticsNode.load({
      writeKey: 'abc123',
    })

    ajs = analytics

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    global.Date = jest.fn(() => myDate)
    /* eslint-disable @typescript-eslint/unbound-method */
    global.Date.UTC = _Date.UTC
    global.Date.parse = _Date.parse
    global.Date.now = _Date.now
  })

  describe('hydrateMessage', () => {
    test('merges message with default values', () => {
      const hydrated = hydrateMessage({
        type: 'track',
        anonymousId: 'anon',
        properties: {
          dogs: 'da bomb',
        },
      })

      expect(hydrated).toEqual({
        _metadata: {
          nodeVersion: '12.16.1',
        },
        context: {
          library: {
            name: 'analytics-node-next',
            version: 'latest',
          },
        },
        properties: {
          dogs: 'da bomb',
        },
        timestamp: new Date(),
        anonymousId: 'anon',
        messageId: expect.any(String),
        type: 'track',
      })
    })
  })

  describe('AJS', () => {
    test('fireEvent instantiates the right event types', async () => {
      await ajs.track('track')

      expect(postToTrackingAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          obj: expect.objectContaining({
            type: 'track',
          }),
        }),
        'abc123'
      )

      await ajs.identify('identify')

      expect(postToTrackingAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          obj: expect.objectContaining({
            type: 'identify',
          }),
        }),
        'abc123'
      )

      await ajs.page('page')

      expect(postToTrackingAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          obj: expect.objectContaining({
            type: 'page',
          }),
        }),
        'abc123'
      )

      await ajs.group('group')

      expect(postToTrackingAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          obj: expect.objectContaining({
            type: 'group',
          }),
        }),
        'abc123'
      )

      await ajs.alias('alias')

      expect(postToTrackingAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          obj: expect.objectContaining({
            type: 'alias',
          }),
        }),
        'abc123'
      )

      await ajs.screen('screen')

      expect(postToTrackingAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          obj: expect.objectContaining({
            type: 'screen',
          }),
        }),
        'abc123'
      )
    })
  })
})
