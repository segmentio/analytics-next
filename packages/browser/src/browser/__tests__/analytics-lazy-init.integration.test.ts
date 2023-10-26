import { CorePlugin, PluginType, sleep } from '@segment/analytics-core'
import { getBufferedPageCtxFixture } from '../../test-helpers/fixtures'
import unfetch from 'unfetch'
import { AnalyticsBrowser } from '..'
import { Analytics } from '../../core/analytics'
import { createSuccess } from '../../test-helpers/factories'
import { createDeferred } from '../../lib/create-deferred'
import { PluginFactory } from '../../plugins/remote-loader'

const nextTickP = () => new Promise((r) => setTimeout(r, 0))

jest.mock('unfetch')

const mockFetchSettingsSuccessResponse = () => {
  return jest
    .mocked(unfetch)
    .mockImplementation(() => createSuccess({ integrations: {} }))
}

describe('Lazy initialization', () => {
  let trackSpy: jest.SpiedFunction<Analytics['track']>
  let fetched: jest.MockedFn<typeof unfetch>
  beforeEach(() => {
    fetched = mockFetchSettingsSuccessResponse()
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
  const trackSpy = jest.fn()

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
    jest.mock('unfetch')
    jest.mocked(unfetch).mockImplementation(() =>
      createSuccess({
        integrations: {},
        remotePlugins: [
          {
            name: 'braze',
            libraryName: 'braze',
          },
          {
            name: 'google',
            libraryName: 'google',
          },
        ],
      })
    )
  })

  afterAll(() => jest.resetAllMocks())

  it('loads destinations in the background', async () => {
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

    await analytics.load({
      writeKey: 'abc',
      plugins: [dest1Harness.factory, dest2Harness.factory],
    })

    // we won't hold enrichment plugin from loading since they are not lazy loaded
    testEnrichmentHarness.loadingGuard.resolve()
    // and we'll also let one destination load so we can assert some behaviours
    dest1Harness.loadingGuard.resolve()

    await testEnrichmentHarness.loadPromise
    await dest1Harness.loadPromise

    analytics.track('test event 1').catch(() => {})

    // even though there's one destination that still hasn't loaded, the next assertions
    // prove that the event pipeline is flowing regardless

    await nextTickP()
    expect(testEnrichmentHarness.trackSpy).toHaveBeenCalledTimes(1)

    await nextTickP()
    expect(dest1Harness.trackSpy).toHaveBeenCalledTimes(1)

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
  })

  it('emits initialize only when all destinations have loaded', async () => {
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

    // let one destination load
    dest1Harness.loadingGuard.resolve()
    await dest1Harness.loadPromise

    analytics.track('test event 1').catch(() => {})

    // while events can flow with just one destination loaded...
    await nextTickP()
    await nextTickP()
    expect(dest1Harness.trackSpy).toHaveBeenCalledTimes(1)

    // ...initialize is still not emitted
    expect(initializeEmitted).toBe(false)

    // when the other destination is ready aswell...
    dest2Harness.loadingGuard.resolve()
    await dest2Harness.loadPromise

    // ...now initialize event is emitted
    await nextTickP()
    expect(initializeEmitted).toBe(true)
  })

  it('times out destinations that take too long to load', async () => {
    const dest1Harness = createTestPluginFactory('braze', 'destination')
    const dest2Harness = createTestPluginFactory('google', 'destination')

    const analytics = new AnalyticsBrowser()

    await analytics.load({
      writeKey: 'abc',
      plugins: [dest1Harness.factory, dest2Harness.factory],
    })

    // one destination loads properly
    dest1Harness.loadingGuard.resolve()
    await dest1Harness.loadPromise

    const t = await analytics.track('test event 1')

    // one of the two destinations has failed, and is reported in the metrics as-such
    const errorMetrics = t.stats.metrics.filter(
      (m) => m.metric === 'analytics_js.action_plugin.invoke.error'
    )

    expect(errorMetrics).toHaveLength(1)
    expect(errorMetrics[0].tags[1]).toBe('action_plugin_name:google')
  })
})
