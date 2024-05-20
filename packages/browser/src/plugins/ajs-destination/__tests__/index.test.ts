/* eslint-disable @typescript-eslint/no-floating-promises */
import jsdom from 'jsdom'
import unfetch from 'unfetch'
import { ajsDestinations, LegacyDestination } from '..'
import { Analytics } from '../../../core/analytics'
import { CDNSettings } from '../../../browser'
import { Context } from '../../../core/context'
import { Plan } from '../../../core/events'
import { tsubMiddleware } from '../../routing-middleware'
import { AMPLITUDE_WRITEKEY } from '../../../test-helpers/test-writekeys'
import { PersistedPriorityQueue } from '../../../lib/priority-queue/persisted'
import * as Factory from '../../../test-helpers/factories'

const cdnResponse: CDNSettings = {
  integrations: {
    Zapier: {
      type: 'server',
    },
    WithNoVersion: {
      type: 'browser',
    },
    WithProperTypeComponent: {
      versionSettings: {
        componentTypes: ['browser'],
      },
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
    Iterable: {
      type: 'browser',
      name: 'Iterable',
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
        target_type: 'workspace::project::destination',
        transformers: [[{ type: 'drop' }]],
        destinationName: 'Amplitude',
      },
    ],
  },
}

const fetchSettings = Factory.createSuccess(cdnResponse)

jest.mock('unfetch', () => {
  return jest.fn()
})

describe('loading ajsDestinations', () => {
  const writeKey = 'foo'
  beforeEach(async () => {
    jest.resetAllMocks()

    jest
      .mocked(unfetch)
      // @ts-ignore: ignore Response required fields
      .mockImplementation((): Promise<Response> => fetchSettings)
  })

  it('loads version overrides', () => {
    const destinations = ajsDestinations(writeKey, cdnResponse, {}, {})

    const withVersionSettings = destinations.find(
      (d) => d.name === 'WithVersionSettings'
    )

    const withVersionOverrides = destinations.find(
      (d) => d.name === 'WithVersionOverrides'
    )

    const withNoVersion = destinations.find((d) => d.name === 'WithNoVersion')

    expect(withVersionSettings?.version).toBe('1.2.3')
    expect(withVersionOverrides?.version).toBe('9.9.9')
    expect(withNoVersion?.version).toBe('latest')
  })

  // This test should temporary. It must be deleted once we fix the Iterable metadata
  it('ignores Iterable', () => {
    const destinations = ajsDestinations(writeKey, cdnResponse, {}, {})
    const iterable = destinations.find((d) => d.name === 'Iterable')
    expect(iterable).toBeUndefined()
  })

  describe('versionSettings.components', () => {
    it('ignores [componentType:browser] when bundlingStatus is unbundled', () => {
      const destinations = ajsDestinations(
        writeKey,
        {
          integrations: {
            'Some server destination': {
              versionSettings: {
                componentTypes: ['server'],
              },
              bundlingStatus: 'bundled', // this combination will never happen
            },
            'Device Mode Customer.io': {
              versionSettings: {
                componentTypes: ['browser'],
              },
              bundlingStatus: 'bundled',
            },
            'Cloud Mode Customer.io': {
              versionSettings: {
                componentTypes: ['browser'],
              },
              bundlingStatus: 'unbundled',
            },
          },
        },
        {},
        {}
      )
      expect(destinations.length).toBe(1)
    })

    it('loads [componentType:browser] when bundlingStatus is not defined', () => {
      const destinations = ajsDestinations(
        writeKey,
        {
          integrations: {
            'Some server destination': {
              versionSettings: {
                componentTypes: ['server'],
              },
              bundlingStatus: 'bundled', // this combination will never happen
            },
            'Device Mode Customer.io': {
              versionSettings: {
                componentTypes: ['browser'],
              },
              bundlingStatus: 'bundled',
            },
            'Device Mode no bundling status Customer.io': {
              versionSettings: {
                componentTypes: ['browser'],
              },
            },
          },
        },
        {},
        {}
      )
      expect(destinations.length).toBe(2)
    })
  })

  it('loads type:browser legacy ajs destinations from cdn', () => {
    const destinations = ajsDestinations(writeKey, cdnResponse, {}, {})
    // ignores segment.io
    expect(destinations.length).toBe(5)
  })

  it('ignores type:browser when bundlingStatus is unbundled', () => {
    const destinations = ajsDestinations(
      writeKey,
      {
        integrations: {
          'Some server destination': {
            type: 'server',
            bundlingStatus: 'bundled', // this combination will never happen
          },
          'Device Mode Customer.io': {
            type: 'browser',
            bundlingStatus: 'bundled',
          },
          'Cloud Mode Customer.io': {
            type: 'browser',
            bundlingStatus: 'unbundled',
          },
        },
      },
      {},
      {}
    )
    expect(destinations.length).toBe(1)
  })

  it('loads type:browser when bundlingStatus is not defined', () => {
    const destinations = ajsDestinations(
      writeKey,
      {
        integrations: {
          'Some server destination': {
            type: 'server',
            bundlingStatus: 'bundled', // this combination will never happen
          },
          'Device Mode Customer.io': {
            type: 'browser',
            bundlingStatus: 'bundled',
          },
          'Device Mode no bundling status Customer.io': {
            type: 'browser',
          },
        },
      },
      {},
      {}
    )
    expect(destinations.length).toBe(2)
  })

  it('ignores destinations of type:server', () => {
    const destinations = ajsDestinations(writeKey, cdnResponse, {}, {})
    expect(destinations.find((d) => d.name === 'Zapier')).toBe(undefined)
  })

  it('does not load integrations when All:false', () => {
    const destinations = ajsDestinations(
      writeKey,
      cdnResponse,
      {
        All: false,
      },
      {}
    )
    expect(destinations.length).toBe(0)
  })

  it('loads integrations when All:false, <integration>: true', () => {
    const destinations = ajsDestinations(
      writeKey,
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

  it('adds a tsub middleware for matching rules', () => {
    const middleware = tsubMiddleware(
      cdnResponse.middlewareSettings!.routingRules
    )
    const destinations = ajsDestinations(
      writeKey,
      cdnResponse,
      {},
      {},
      middleware
    )
    const amplitude = destinations.find((d) => d.name === 'Amplitude')
    expect(amplitude?.middleware.length).toBe(1)
  })
})

describe('settings', () => {
  it('does not delete type=any', () => {
    const dest = new LegacyDestination(
      'Yandex',
      'latest',
      'writeKey',
      {
        type: 'custom',
      },
      {}
    )
    expect(dest.settings['type']).toEqual('custom')
  })

  it('deletes type=browser', () => {
    const dest = new LegacyDestination(
      'Amplitude',
      'latest',
      'writeKey',
      {
        type: 'browser',
      },
      {}
    )

    expect(dest.settings['type']).toBeUndefined()
  })
})

describe('options', () => {
  it('#disableClientPersistence affects underlying queue', () => {
    const defaultDestWithPersistance = new LegacyDestination(
      'LocalStorageUser',
      'latest',
      'writeKey',
      {},
      {}
    )
    const destWithPersistance = new LegacyDestination(
      'LocalStorageUserToo',
      'latest',
      'writeKey',
      {},
      { disableClientPersistence: false }
    )
    const destWithoutPersistance = new LegacyDestination(
      'MemoryUser',
      'latest',
      'writeKey',
      {},
      { disableClientPersistence: true }
    )

    expect(
      defaultDestWithPersistance.buffer instanceof PersistedPriorityQueue
    ).toBeTruthy()
    expect(
      destWithPersistance.buffer instanceof PersistedPriorityQueue
    ).toBeTruthy()
    expect(
      destWithoutPersistance.buffer instanceof PersistedPriorityQueue
    ).toBeFalsy()
  })
})

describe('remote loading', () => {
  const loadAmplitude = async (
    obfuscate = false
  ): Promise<LegacyDestination> => {
    const writeKey = 'abc'
    const ajs = new Analytics({
      writeKey,
    })

    const dest = new LegacyDestination(
      'Amplitude',
      'latest',
      writeKey,
      {
        apiKey: AMPLITUDE_WRITEKEY,
      },
      { obfuscate }
    )

    await dest.load(Context.system(), ajs)
    await dest.ready()
    return dest
  }

  beforeEach(() => {
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
      () => jsd.window as unknown as Window & typeof globalThis
    )
  })

  it('loads integrations from the Segment CDN', async () => {
    await loadAmplitude()

    const sources = Array.from(window.document.querySelectorAll('script'))
      .map((s) => s.src)
      .filter(Boolean)

    expect(sources).toMatchObject(
      expect.arrayContaining([
        'https://cdn.segment.com/next-integrations/integrations/amplitude/latest/amplitude.dynamic.js.gz',
        expect.stringContaining(
          'https://cdn.segment.com/next-integrations/integrations/vendor/commons'
        ),
        'https://cdn.amplitude.com/libs/amplitude-5.2.2-min.gz.js',
      ])
    )
  })

  it('loads obfuscated integrations from the Segment CDN', async () => {
    await loadAmplitude(true)

    const sources = Array.from(window.document.querySelectorAll('script'))
      .map((s) => s.src)
      .filter(Boolean)

    expect(sources).toMatchObject(
      expect.arrayContaining([
        'https://cdn.segment.com/next-integrations/integrations/YW1wbGl0dWRl/latest/YW1wbGl0dWRl.dynamic.js.gz',
        expect.stringContaining(
          'https://cdn.segment.com/next-integrations/integrations/vendor/commons'
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

  it('forwards identify calls to obfuscated integration', async () => {
    const dest = await loadAmplitude(true)
    jest.spyOn(dest.integration!, 'identify')

    const evt = new Context({ type: 'identify' })
    await dest.identify(evt)

    expect(dest.integration?.identify).toHaveBeenCalled()
  })

  it('forwards track calls to obfuscated integration', async () => {
    const dest = await loadAmplitude(true)
    jest.spyOn(dest.integration!, 'track')

    await dest.track(new Context({ type: 'track' }))
    expect(dest.integration?.track).toHaveBeenCalled()
  })

  it('forwards page calls to obfuscated integration', async () => {
    const dest = await loadAmplitude(true)
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
      () => jsd.window as unknown as Window & typeof globalThis
    )
  })

  const loadAmplitude = async (plan: Plan): Promise<LegacyDestination> => {
    const writeKey = 'abc'
    const ajs = new Analytics({
      writeKey,
    })

    const dest = new LegacyDestination(
      'amplitude',
      'latest',
      writeKey,
      {
        apiKey: AMPLITUDE_WRITEKEY,
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

  it('drops event when event is disabled', async () => {
    const dest = await loadAmplitude({
      track: {
        'Track Event': {
          enabled: false,
          integrations: { amplitude: false },
        },
      },
    })

    jest.spyOn(dest.integration!, 'track')

    const ctx = new Context({ type: 'page', event: 'Track Event' })
    await expect(() => dest.track(ctx)).rejects.toMatchInlineSnapshot(`
      ContextCancelation {
        "reason": "Event Track Event disabled for integration amplitude in tracking plan",
        "retry": false,
        "type": "Dropped by plan",
      }
    `)

    expect(dest.integration?.track).not.toHaveBeenCalled()
    expect(ctx.event.integrations).toMatchInlineSnapshot(`
      {
        "All": false,
        "Segment.io": true,
      }
    `)
  })

  it('drops event when unplanned event is disabled', async () => {
    const dest = await loadAmplitude({
      track: {
        __default: {
          enabled: false,
          integrations: {},
        },
      },
    })

    jest.spyOn(dest.integration!, 'track')

    const ctx = new Context({ type: 'page', event: 'Track Event' })
    await expect(() => dest.track(ctx)).rejects.toMatchInlineSnapshot(`
      ContextCancelation {
        "reason": "Event Track Event disabled for integration amplitude in tracking plan",
        "retry": false,
        "type": "Dropped by plan",
      }
    `)

    expect(dest.integration?.track).not.toHaveBeenCalled()
    expect(ctx.event.integrations).toMatchInlineSnapshot(`
      {
        "All": false,
        "Segment.io": true,
      }
    `)
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

  it('does not drop events with same name when unplanned events are disallowed', async () => {
    const dest = await loadAmplitude({
      track: {
        __default: { enabled: false, integrations: {} },
        'Track Event': {
          enabled: true,
          integrations: {},
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
    const ctx = new Context({ type: 'page', event: 'Track Event' })
    await expect(() => dest.track(ctx)).rejects.toMatchInlineSnapshot(`
      ContextCancelation {
        "reason": "Event Track Event disabled for integration amplitude in tracking plan",
        "retry": false,
        "type": "Dropped by plan",
      }
    `)

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

  it('properly sets event integrations object with enabled plan', async () => {
    const dest = await loadAmplitude({
      track: {
        'Track Event': {
          enabled: true,
          integrations: { amplitude: true },
        },
      },
    })

    const ctx = await dest.track(
      new Context({ type: 'page', event: 'Track Event' })
    )
    expect(ctx.event.integrations).toEqual({ amplitude: true })
  })

  it('sets event integrations object when integration is disabled', async () => {
    const dest = await loadAmplitude({
      track: {
        'Track Event': {
          enabled: true,
          integrations: { amplitude: false },
        },
      },
    })
    jest.spyOn(dest.integration!, 'track')
    const ctx = new Context({ type: 'page', event: 'Track Event' })

    await expect(() => dest.track(ctx)).rejects.toMatchInlineSnapshot(`
      ContextCancelation {
        "reason": "Event Track Event disabled for integration amplitude in tracking plan",
        "retry": false,
        "type": "Dropped by plan",
      }
    `)

    expect(dest.integration?.track).not.toHaveBeenCalled()
    expect(ctx.event.integrations).toEqual({ amplitude: false })
  })

  it('doesnt set event integrations object with different event', async () => {
    const dest = await loadAmplitude({
      track: {
        'Track Event': {
          enabled: true,
          integrations: { amplitude: true },
        },
      },
    })

    const ctx = await dest.track(
      new Context({ type: 'page', event: 'Not Track Event' })
    )
    expect(ctx.event.integrations).toEqual({})
  })
})

describe('option overrides', () => {
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
      () => jsd.window as unknown as Window & typeof globalThis
    )
  })

  it('accepts settings overrides from options', async () => {
    const cdnSettings = {
      integrations: {
        Amplitude: {
          type: 'browser',
          apiKey: '123',
          secondOption: '👻',
        },
      },
    }

    const initOptions = {
      integrations: {
        Amplitude: {
          apiKey: 'abc',
          thirdOption: '🤠',
        },
      },
    }

    const destinations = ajsDestinations(
      'writeKey',
      cdnSettings,
      {},
      initOptions
    )
    const amplitude = destinations[0]

    await amplitude.load(Context.system(), {} as Analytics)
    await amplitude.ready()

    expect(amplitude.settings).toMatchObject({
      apiKey: 'abc', // overriden
      secondOption: '👻', // merged from cdn settings
      thirdOption: '🤠', // merged from init options
    })

    expect(amplitude.integration?.options).toEqual(
      expect.objectContaining({
        apiKey: 'abc', // overriden
        secondOption: '👻', // merged from cdn settings
        thirdOption: '🤠', // merged from init options
      })
    )
  })
})
