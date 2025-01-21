import { CorePlugin, PluginType, sleep } from '@segment/analytics-core'
import {
  cdnSettingsMinimal,
  createMockFetchImplementation,
  createRemotePlugin,
  getBufferedPageCtxFixture,
} from '../../test-helpers/fixtures'
import unfetch from 'unfetch'
import { AnalyticsBrowser } from '..'
import { Analytics } from '../../core/analytics'
import { createDeferred } from '@segment/analytics-generic-utils'
import { PluginFactory } from '../../plugins/remote-loader'

const nextTickP = () => new Promise((r) => setTimeout(r, 0))

jest.mock('unfetch')

beforeEach(() => {
  document.head.innerHTML = `
        <script id="initial"></script>`.trim()
})

describe('Lazy initialization', () => {
  let trackSpy: jest.SpiedFunction<Analytics['track']>
  let fetched: jest.MockedFn<typeof unfetch>
  beforeEach(() => {
    fetched = jest
      .mocked(unfetch)
      .mockImplementation(createMockFetchImplementation())
    trackSpy = jest.spyOn(Analytics.prototype, 'track')
  })

  it('Should be able to delay initialization ', async () => {
    const analytics = new AnalyticsBrowser()
    const track = analytics.track('foo')
    await sleep(100)
    expect(trackSpy).not.toBeCalled()
    analytics.load({ writeKey: 'abc' })
    await track
    expect(trackSpy).toBeCalledWith('foo', getBufferedPageCtxFixture())
  })

  it('.load method return an analytics instance', async () => {
    const analytics = new AnalyticsBrowser().load({ writeKey: 'foo' })
    expect(analytics instanceof AnalyticsBrowser).toBeTruthy()
  })

  it('should ignore subsequent .load calls', async () => {
    const analytics = new AnalyticsBrowser()
    await analytics.load({ writeKey: 'my-write-key' })
    await analytics.load({ writeKey: 'def' })
    expect(fetched).toBeCalledTimes(1)
    expect(fetched).toBeCalledWith(
      expect.stringContaining(
        'https://cdn.segment.com/v1/projects/my-write-key/settings'
      )
    )
  })
})

const createTestPluginFactory = (name: string, type: PluginType) => {
  const lock = createDeferred<void>()
  const load = createDeferred<void>()
  const trackSpy = jest.fn().mockImplementation((ctx) => {
    ctx.event.context!.ran = true
    return ctx
  })

  const factory: PluginFactory = () => {
    return {
      name,
      type,
      version: '1.0.0',
      load: jest
        .fn()
        .mockImplementation(() => lock.promise.then(() => load.resolve())),
      isLoaded: () => lock.isSettled(),
      track: trackSpy,
    }
  }

  factory.pluginName = name

  return {
    loadingGuard: lock,
    trackSpy,
    factory,
    loadPromise: load.promise,
  }
}

describe('Lazy destination loading', () => {
  beforeEach(() => {
    jest.mocked(unfetch).mockImplementation(
      createMockFetchImplementation({
        ...cdnSettingsMinimal,
        integrations: {
          ...cdnSettingsMinimal.integrations,
          braze: {},
          google: {},
        },
        remotePlugins: [
          createRemotePlugin('braze'),
          createRemotePlugin('google'),
        ],
      })
    )
  })

  afterAll(() => jest.resetAllMocks())

  describe('critical plugins (plugins that block the event pipeline)', () => {
    test('pipeline _will_ wait for *enrichment* plugins to load', async () => {
      jest.mocked(unfetch).mockImplementation(
        createMockFetchImplementation({
          remotePlugins: [],
        })
      )
      const testEnrichmentHarness = createTestPluginFactory(
        'enrichIt',
        'enrichment'
      )

      const analytics = new AnalyticsBrowser()

      const testPlugin = testEnrichmentHarness.factory(null) as CorePlugin

      analytics.register(testPlugin).catch(() => {})
      analytics.track('test event 1').catch(() => {})

      const analyticsLoaded = analytics.load({
        writeKey: 'abc',
        plugins: [],
      })

      expect(testEnrichmentHarness.trackSpy).not.toHaveBeenCalled()

      // now we'll let the enrichment plugin load
      testEnrichmentHarness.loadingGuard.resolve()

      await analyticsLoaded
      await sleep(200)
      expect(testEnrichmentHarness.trackSpy).toHaveBeenCalledTimes(1)
    })

    test('pipeline _will_ wait for *before* plugins to load', async () => {
      jest.mocked(unfetch).mockImplementation(
        createMockFetchImplementation({
          remotePlugins: [],
        })
      )
      const testBeforeHarness = createTestPluginFactory('enrichIt', 'before')

      const analytics = new AnalyticsBrowser()

      const testPlugin = testBeforeHarness.factory(null) as CorePlugin

      analytics.register(testPlugin).catch(() => {})
      analytics.track('test event 1').catch(() => {})

      const analyticsLoaded = analytics.load({
        writeKey: 'abc',
        plugins: [],
      })

      expect(testBeforeHarness.trackSpy).not.toHaveBeenCalled()

      // now we'll let the before  plugin load
      testBeforeHarness.loadingGuard.resolve()

      await analyticsLoaded
      await sleep(200)
      expect(testBeforeHarness.trackSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('non-critical plugins (plugins that do not block the event pipeline)', () => {
    it('destination loading does not block the event pipeline, but enrichment plugins do', async () => {
      const testEnrichmentHarness = createTestPluginFactory(
        'enrichIt',
        'enrichment'
      )
      const dest1Harness = createTestPluginFactory('braze', 'destination')
      const dest2Harness = createTestPluginFactory('google', 'destination')

      const analytics = new AnalyticsBrowser()

      const testEnrichmentPlugin = testEnrichmentHarness.factory(
        null
      ) as CorePlugin

      analytics.register(testEnrichmentPlugin).catch(() => {})

      const p = analytics.load({
        writeKey: 'abc',
        plugins: [dest1Harness.factory, dest2Harness.factory],
      })

      // we won't hold enrichment plugin from loading since they are not lazy loaded
      testEnrichmentHarness.loadingGuard.resolve()
      await p
      // and we'll also let one destination load so we can assert some behaviours
      dest1Harness.loadingGuard.resolve()

      analytics.track('test event 1').catch(() => {})

      // even though there's one destination that still hasn't loaded, the next assertions
      // prove that the event pipeline is flowing regardless

      await nextTickP()
      expect(testEnrichmentHarness.trackSpy).toHaveBeenCalledTimes(1)

      await nextTickP()
      expect(dest1Harness.trackSpy).toHaveBeenCalledTimes(1)
      expect(dest1Harness.trackSpy.mock.calls[0][0].event.context.ran).toBe(
        true
      )

      // now we'll send another event

      analytics.track('test event 2').catch(() => {})

      // even though there's one destination that still hasn't loaded, the next assertions
      // prove that the event pipeline is flowing regardless

      await nextTickP()
      expect(testEnrichmentHarness.trackSpy).toHaveBeenCalledTimes(2)

      await nextTickP()
      expect(dest1Harness.trackSpy).toHaveBeenCalledTimes(2)

      // this whole time the other destination was not engaged with at all
      expect(dest2Harness.trackSpy).not.toHaveBeenCalled()

      // now "after some time" the other destination will load
      dest2Harness.loadingGuard.resolve()
      await dest2Harness.loadPromise

      // and now that it is "online" - the previous events that it missed will be handed over
      await nextTickP()
      expect(dest2Harness.trackSpy).toHaveBeenCalledTimes(2)

      // should not add any other script tags
      expect(document.querySelectorAll('script').length).toBe(1)
      expect(document.getElementsByTagName('script')[0].id).toBe('initial')
    })
  })
  it('emits initialize regardless of whether all destinations have loaded', async () => {
    const dest1Harness = createTestPluginFactory('braze', 'destination')
    const dest2Harness = createTestPluginFactory('google', 'destination')

    const analytics = new AnalyticsBrowser()

    let initializeEmitted = false

    analytics.on('initialize', () => {
      initializeEmitted = true
    })

    await analytics.load({
      writeKey: 'abc',
      plugins: [dest1Harness.factory, dest2Harness.factory],
    })

    expect(initializeEmitted).toBe(true)
  })
})
