import { JSDOM } from 'jsdom'
import { AnalyticsBrowser } from '../..'
import { LegacyDestination } from '../../plugins/ajs-destination'
import { ClassicIntegrationBuilder } from '../../plugins/ajs-destination/types'
import { ActionDestination } from '../../plugins/remote-loader'
import unfetch from 'unfetch'
import { cdnSettingsMinimal } from '../../test-helpers/fixtures/cdn-settings'
import { Fake } from '../../test-helpers/fixtures/classic-destination'
import { Plugin } from '../../core/plugin'
import { createMockFetchImplementation } from '../../test-helpers/fixtures/create-fetch-method'
const amplitudeWriteKey = 'foo'
const writeKey = 'foo'

jest.mock('unfetch')

const mockFetchCdnSettings = (cdnSettings: any = {}) => {
  return jest
    .mocked(unfetch)
    .mockImplementation(createMockFetchImplementation(cdnSettings))
}

describe.skip('Integrations', () => {
  beforeEach(async () => {
    mockFetchCdnSettings()

    const html = `
    <!DOCTYPE html>
      <head>
        <script>'hi'</script>
      </head>
      <body>
      </body>
    </html>
    `.trim()

    const jsd = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'https://localhost',
    })

    const windowSpy = jest.spyOn(global, 'window', 'get')
    windowSpy.mockImplementation(
      () => jsd.window as unknown as Window & typeof globalThis
    )

    const documentSpy = jest.spyOn(global, 'document', 'get')
    documentSpy.mockImplementation(
      () => jsd.window.document as unknown as Document
    )
  })

  describe('addDestinationMiddleware', () => {
    it('supports registering destination middlewares', async () => {
      const [analytics] = await AnalyticsBrowser.load({
        writeKey,
      })

      const amplitude = new LegacyDestination(
        'amplitude',
        'latest',
        {
          apiKey: amplitudeWriteKey,
        },
        {}
      )

      await analytics.register(amplitude)
      await amplitude.ready()

      analytics
        .addDestinationMiddleware('amplitude', ({ next, payload }) => {
          payload.obj.properties!.hello = 'from the other side'
          next(payload)
        })
        .catch((err) => {
          throw err
        })

      const integrationMock = jest.spyOn(amplitude.integration!, 'track')
      const ctx = await analytics.track('Hello!')

      // does not modify the event
      expect(ctx.event.properties).not.toEqual({
        hello: 'from the other side',
      })

      const calledWith = integrationMock.mock.calls[0][0].properties()

      // only impacted this destination
      expect(calledWith).toEqual({
        ...ctx.event.properties,
        hello: 'from the other side',
      })
    })

    it('supports registering action destination middlewares', async () => {
      const testPlugin: Plugin = {
        name: 'test',
        type: 'destination',
        version: '0.1.0',
        load: () => Promise.resolve(),
        isLoaded: () => true,
      }

      const [analytics] = await AnalyticsBrowser.load({
        writeKey,
      })

      const fullstory = new ActionDestination('fullstory', testPlugin)

      await analytics.register(fullstory)
      await fullstory.ready()

      analytics
        .addDestinationMiddleware('fullstory', ({ next, payload }) =>
          next(payload)
        )
        .catch((err) => {
          throw err
        })

      expect(analytics.queue.plugins).toContain(fullstory)
    })
  })

  describe('Legacy / Classic Destinations', () => {
    it('lists all legacy destinations', async () => {
      const amplitude = new LegacyDestination(
        'Amplitude',
        'latest',
        {
          apiKey: amplitudeWriteKey,
        },
        {}
      )

      const ga = new LegacyDestination('Google-Analytics', 'latest', {}, {})

      const [analytics] = await AnalyticsBrowser.load({
        writeKey,
        plugins: [amplitude, ga],
      })

      await analytics.ready()

      expect(analytics.Integrations).toMatchInlineSnapshot(`
      Object {
        "Amplitude": [Function],
        "Google-Analytics": [Function],
      }
    `)
    })

    it('catches destinations with dots in their names', async () => {
      const amplitude = new LegacyDestination(
        'Amplitude',
        'latest',
        {
          apiKey: amplitudeWriteKey,
        },
        {}
      )

      const ga = new LegacyDestination('Google-Analytics', 'latest', {}, {})
      const customerIO = new LegacyDestination('Customer.io', 'latest', {}, {})

      const [analytics] = await AnalyticsBrowser.load({
        writeKey,
        plugins: [amplitude, ga, customerIO],
      })

      await analytics.ready()

      expect(analytics.Integrations).toMatchInlineSnapshot(`
      Object {
        "Amplitude": [Function],
        "Customer.io": [Function],
        "Google-Analytics": [Function],
      }
    `)
    })

    it('uses directly provided classic integrations without fetching them from cdn', async () => {
      mockFetchCdnSettings({ integrations: cdnSettingsMinimal })
      const intializeSpy = jest.spyOn(Fake.prototype, 'initialize')
      const trackSpy = jest.spyOn(Fake.prototype, 'track')

      const [analytics] = await AnalyticsBrowser.load(
        {
          writeKey,
          classicIntegrations: [Fake],
        },
        {
          integrations: {
            Fake: {},
          },
        }
      )
      await analytics.ready()

      await analytics.track('test event')

      expect(trackSpy).toHaveBeenCalledTimes(1)
      expect(intializeSpy).toHaveBeenCalledTimes(1)
    })

    it('ignores directly provided classic integrations if settings for them are unavailable', async () => {
      mockFetchCdnSettings({ integrations: {} })
      const intializeSpy = jest.spyOn(Fake.prototype, 'initialize')
      const trackSpy = jest.spyOn(Fake.prototype, 'track')

      const [analytics] = await AnalyticsBrowser.load({
        writeKey,
        classicIntegrations: [Fake as unknown as ClassicIntegrationBuilder],
      })

      await analytics.ready()

      expect(intializeSpy).not.toHaveBeenCalled()

      await analytics.track('test event')

      expect(trackSpy).not.toHaveBeenCalled()
    })
  })
})
