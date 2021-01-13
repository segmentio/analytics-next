/* eslint-disable @typescript-eslint/no-floating-promises */
import { ajsDestinations, LegacyDestination } from '..'
import { mocked } from 'ts-jest/utils'
import unfetch from 'unfetch'
import jsdom from 'jsdom'
import { Context } from '../../../core/context'
import { Analytics } from '../../../analytics'
import { Plan } from '../../../core/events'
import { LegacySettings } from '../../../browser'
import { tsubMiddleware } from '../../routing-middleware'

const cdnResponse: LegacySettings = {
  integrations: {
    Zapier: {
      type: 'server',
    },
    WithNoVersion: {
      type: 'browser',
    },
    WithLegacyVersion: {
      version: '3.0.7',
      type: 'browser',
    },
    WithVersionSettings: {
      versionSettings: {
        version: '1.2.3',
      },
      type: 'browser',
    },
    WithVersionOverrides: {
      versionSettings: {
        version: '1.2.3',
        override: '9.9.9',
      },
      type: 'browser',
    },
    'Amazon S3': {},
    Amplitude: {
      type: 'browser',
    },
    Segmentio: {
      type: 'browser',
    },
  },
  middlewareSettings: {
    routingRules: [
      {
        matchers: [
          {
            ir: '["=","event",{"value":"Item Impression"}]',
            type: 'fql',
          },
        ],
        scope: 'destinations',
        // eslint-disable-next-line @typescript-eslint/camelcase
        target_type: 'workspace::project::destination',
        transformers: [[{ type: 'drop' }]],
        destinationName: 'Amplitude',
      },
    ],
  },
}

const fetchSettings = Promise.resolve({
  json: () => Promise.resolve(cdnResponse),
})

jest.mock('unfetch', () => {
  return jest.fn()
})

describe('ajsDestinations', () => {
  beforeEach(async () => {
    jest.resetAllMocks()

    // @ts-ignore: ignore Response required fields
    mocked(unfetch).mockImplementation((): Promise<Response> => fetchSettings)
  })

  // This test should temporary. Once we deprecate `version`, we can change it
  // to `it('loads version overrides')`
  it('considers both legacy and new version formats', async () => {
    const destinations = await ajsDestinations(cdnResponse, {}, {})
    const withLegacyVersion = destinations.find(
      (d) => d.name === 'WithLegacyVersion'
    )
    const withVersionSettings = destinations.find(
      (d) => d.name === 'WithVersionSettings'
    )
    const withVersionOverrides = destinations.find(
      (d) => d.name === 'WithVersionOverrides'
    )
    const withNoVersion = destinations.find((d) => d.name === 'WithNoVersion')

    expect(withLegacyVersion?.version).toBe('3.0.7')
    expect(withVersionSettings?.version).toBe('1.2.3')
    expect(withVersionOverrides?.version).toBe('9.9.9')
    expect(withNoVersion?.version).toBe('latest')
  })

  it('loads type:browser legacy ajs destinations from cdn', async () => {
    const destinations = await ajsDestinations(cdnResponse, {}, {})
    expect(destinations.length).toBe(6)
  })

  it('ignores destinations of type:server', async () => {
    const destinations = await ajsDestinations(cdnResponse, {}, {})
    expect(destinations.find((d) => d.name === 'Zapier')).toBe(undefined)
  })

  it('does not load integrations when All:false', async () => {
    const destinations = await ajsDestinations(
      cdnResponse,
      {
        All: false,
      },
      {}
    )
    expect(destinations.length).toBe(0)
  })

  it('loads integrations when All:false, <integration>: true', async () => {
    const destinations = await ajsDestinations(
      cdnResponse,
      {
        All: false,
        Amplitude: true,
        Segmentio: false,
      },
      {}
    )
    expect(destinations.length).toBe(1)
    expect(destinations[0].name).toEqual('Amplitude')
  })

  it('adds a tsub middleware for matching rules', async () => {
    const destinations = await ajsDestinations(cdnResponse)
    const amplitude = destinations.find((d) => d.name === 'Amplitude')
    expect(amplitude?.middleware.length).toBe(1)
  })
})

describe('remote loading', () => {
  const loadAmplitude = async (): Promise<LegacyDestination> => {
    const ajs = new Analytics({
      writeKey: 'abc',
    })

    const dest = new LegacyDestination(
      'Amplitude',
      'latest',
      {
        apiKey: '***REMOVED***',
      },
      {}
    )

    await dest.load(Context.system(), ajs)
    await dest.ready()
    return dest
  }

  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.resetAllMocks()

    const html = `
    <!DOCTYPE html>
      <head>
        <script>'hi'</script>
      </head>
      <body>
      </body>
    </html>
    `.trim()

    const jsd = new jsdom.JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'https://localhost',
    })

    const windowSpy = jest.spyOn(global, 'window', 'get')
    windowSpy.mockImplementation(
      () => (jsd.window as unknown) as Window & typeof globalThis
    )
  })

  it('loads integrations from the Segment CDN', async () => {
    await loadAmplitude()

    const sources = Array.from(window.document.querySelectorAll('script'))
      .map((s) => s.src)
      .filter(Boolean)

    expect(sources).toMatchObject(
      expect.arrayContaining([
        'https://cdn.segment.build/next-integrations/integrations/amplitude/latest/amplitude.dynamic.js.gz',
        expect.stringContaining(
          'https://cdn.segment.build/next-integrations/integrations/vendor/commons'
        ),
        'https://cdn.amplitude.com/libs/amplitude-5.2.2-min.gz.js',
      ])
    )
  })

  it('forwards identify calls to integration', async () => {
    const dest = await loadAmplitude()
    jest.spyOn(dest.integration!, 'identify')

    const evt = new Context({ type: 'identify' })
    await dest.identify(evt)

    expect(dest.integration?.identify).toHaveBeenCalled()
  })

  it('forwards track calls to integration', async () => {
    const dest = await loadAmplitude()
    jest.spyOn(dest.integration!, 'track')

    await dest.track(new Context({ type: 'track' }))
    expect(dest.integration?.track).toHaveBeenCalled()
  })

  it('forwards page calls to integration', async () => {
    const dest = await loadAmplitude()
    jest.spyOn(dest.integration!, 'page')

    await dest.page(new Context({ type: 'page' }))
    expect(dest.integration?.page).toHaveBeenCalled()
  })

  it('applies remote routing rules', async () => {
    const dest = await loadAmplitude()
    jest.spyOn(dest.integration!, 'track')

    dest.addMiddleware(
      tsubMiddleware(cdnResponse.middlewareSettings?.routingRules ?? [])
    )

    // this routing rule should drop the event
    await dest.track(new Context({ type: 'track', event: 'Item Impression' }))
    expect(dest.integration?.track).not.toHaveBeenCalled()
  })
})

describe('plan', () => {
  beforeEach(async () => {
    jest.resetAllMocks()

    const html = `
    <!DOCTYPE html>
      <head>
        <script>'hi'</script>
      </head>
      <body>
      </body>
    </html>
    `.trim()

    const jsd = new jsdom.JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'https://localhost',
    })

    const windowSpy = jest.spyOn(global, 'window', 'get')
    windowSpy.mockImplementation(
      () => (jsd.window as unknown) as Window & typeof globalThis
    )
  })

  const loadAmplitude = async (plan: Plan): Promise<LegacyDestination> => {
    const ajs = new Analytics({
      writeKey: 'abc',
    })

    const dest = new LegacyDestination(
      'amplitude',
      'latest',
      {
        apiKey: '***REMOVED***',
      },
      { plan }
    )

    await dest.load(Context.system(), ajs)
    await dest.ready()
    return dest
  }

  it('does not drop events when no plan is defined', async () => {
    const dest = await loadAmplitude({})

    jest.spyOn(dest.integration!, 'track')

    await dest.track(new Context({ type: 'page', event: 'Track Event' }))
    expect(dest.integration?.track).toHaveBeenCalled()
  })

  it('does not drop events when event is disabled', async () => {
    const dest = await loadAmplitude({
      track: {
        'Track Event': {
          enabled: false,
          integrations: { amplitude: false },
        },
      },
    })

    jest.spyOn(dest.integration!, 'track')

    await dest.track(new Context({ type: 'page', event: 'Track Event' }))
    expect(dest.integration?.track).toHaveBeenCalled()
  })

  it('does not drop events with different names', async () => {
    const dest = await loadAmplitude({
      track: {
        'Fake Track Event': {
          enabled: true,
          integrations: { amplitude: false },
        },
      },
    })

    jest.spyOn(dest.integration!, 'track')

    await dest.track(new Context({ type: 'page', event: 'Track Event' }))
    expect(dest.integration?.track).toHaveBeenCalled()
  })

  it('drops enabled event for matching destination', async () => {
    const dest = await loadAmplitude({
      track: {
        'Track Event': {
          enabled: true,
          integrations: { amplitude: false },
        },
      },
    })

    jest.spyOn(dest.integration!, 'track')

    const unplannedCall = dest.track(
      new Context({ type: 'page', event: 'Track Event' })
    )
    await expect(unplannedCall).rejects.toThrowErrorMatchingInlineSnapshot(
      `"event dropped by plan"`
    )

    expect(dest.integration?.track).not.toHaveBeenCalled()
  })

  it('does not drop enabled event for non-matching destination', async () => {
    const dest = await loadAmplitude({
      track: {
        'Track Event': {
          enabled: true,
          integrations: { 'not amplitude': false },
        },
      },
    })

    jest.spyOn(dest.integration!, 'track')

    await dest.track(new Context({ type: 'page', event: 'Track Event' }))
    expect(dest.integration?.track).toHaveBeenCalled()
  })

  it('does not drop enabled event with enabled destination', async () => {
    const dest = await loadAmplitude({
      track: {
        'Track Event': {
          enabled: true,
          integrations: { amplitude: true },
        },
      },
    })

    jest.spyOn(dest.integration!, 'track')

    await dest.track(new Context({ type: 'page', event: 'Track Event' }))
    expect(dest.integration?.track).toHaveBeenCalled()
  })
})
