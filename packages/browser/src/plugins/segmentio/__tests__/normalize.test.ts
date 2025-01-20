import assert from 'assert'
import cookie from 'js-cookie'
import { SegmentioSettings } from '..'
import { normalize } from '../normalize'
import { Analytics } from '../../../core/analytics'
import { SegmentEvent } from '../../../core/events'
import { JSDOM } from 'jsdom'
import { cdnSettingsMinimal } from '../../../test-helpers/fixtures'
describe('before loading', () => {
  let jsdom: JSDOM

  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.resetAllMocks()

    const html = `
    <!DOCTYPE html>
      <head></head>
      <body></body>
    </html>
    `.trim()

    jsdom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'https://localhost',
    })

    const windowSpy = jest.spyOn(global, 'window', 'get')
    windowSpy.mockImplementation(
      () => jsdom.window as unknown as Window & typeof globalThis
    )
  })

  let options: SegmentioSettings
  let analytics: Analytics

  beforeEach(() => {
    options = { apiKey: 'foo' }
    analytics = new Analytics({ writeKey: options.apiKey })

    window.localStorage.clear()
  })

  afterEach(() => {
    analytics.reset()
    Object.keys(cookie.get()).map((k) => cookie.remove(k))

    if (window.localStorage) {
      window.localStorage.clear()
    }
  })

  describe('#normalize', () => {
    let object: SegmentEvent
    let defaultCtx: any

    beforeEach(() => {
      cookie.remove('s:context.referrer')
      defaultCtx = {
        page: {
          search: '',
        },
      }
      object = {
        type: 'track',
        context: defaultCtx,
      }
    })

    it('should add .anonymousId', () => {
      analytics.user().anonymousId('anon-id')
      normalize(analytics, object, options, cdnSettingsMinimal.integrations)
      assert(object.anonymousId === 'anon-id')
    })

    it('should add .sentAt', () => {
      normalize(analytics, object, options, cdnSettingsMinimal.integrations)
      assert(object.sentAt)
      // assert(type(object.sentAt) === 'date')
    })

    it('should add .userId', () => {
      analytics.user().id('user-id')
      normalize(analytics, object, options, cdnSettingsMinimal.integrations)
      assert(object.userId === 'user-id')
    })

    it('should not replace the .timestamp', () => {
      const timestamp = new Date()
      object.timestamp = timestamp
      normalize(analytics, object, options, cdnSettingsMinimal.integrations)
      assert(object.timestamp === timestamp)
    })

    it('should not replace the .userId', () => {
      analytics.user().id('user-id')
      object.userId = 'existing-id'
      normalize(analytics, object, options, cdnSettingsMinimal.integrations)
      assert(object.userId === 'existing-id')
    })

    it('should always add .anonymousId even if .userId is given', () => {
      object.userId = 'baz'
      normalize(analytics, object, options, cdnSettingsMinimal.integrations)
      assert(object.anonymousId?.length === 36)
    })

    it('should accept anonymousId being set in an event', async () => {
      object.userId = 'baz'
      object.anonymousId = '👻'

      normalize(analytics, object, options, cdnSettingsMinimal.integrations)
      expect(object.anonymousId).toEqual('👻')
    })

    it('should add .writeKey', () => {
      normalize(analytics, object, options, cdnSettingsMinimal.integrations)
      assert(object.writeKey === options.apiKey)
    })

    describe('unbundling', () => {
      it('should add a list of bundled integrations', () => {
        normalize(analytics, object, options, {
          // @ts-ignore
          'Segment.io': {},
          other: {
            bundlingStatus: 'bundled',
          },
        })

        assert(object)
        assert(object._metadata)
        assert.deepEqual(object._metadata.bundled, ['Segment.io', 'other'])
      })

      it('should add a list of bundled ids', () => {
        normalize(
          analytics,
          object,
          {
            ...options,
            maybeBundledConfigIds: {
              other: ['o_123', 'o_456'],
            },
          },
          {
            ...cdnSettingsMinimal.integrations,
            other: {
              bundlingStatus: 'bundled',
            },
          }
        )

        assert(object)
        assert(object._metadata)
        assert.deepEqual(object._metadata.bundledIds, ['o_123', 'o_456'])
      })

      it('should add a list of unbundled integrations when `unbundledIntegrations` is set', () => {
        options.unbundledIntegrations = ['other2']
        normalize(analytics, object, options, {
          ...cdnSettingsMinimal.integrations,
          other2: {
            bundlingStatus: 'unbundled',
          },
        })

        assert(object)
        assert(object._metadata)
        assert.deepEqual(object._metadata.unbundled, ['other2'])
      })
    })

    it('should pick up messageId from AJS', () => {
      normalize(analytics, object, options, cdnSettingsMinimal.integrations) // ajs core generates the message ID here
      const messageId = object.messageId

      normalize(analytics, object, options, cdnSettingsMinimal.integrations)
      assert.equal(object.messageId, messageId)
    })
  })
})
