import cookie from 'js-cookie'
import { Analytics } from '../../../core/analytics'
import type { Context } from '../../../core/context'
import type { Plugin } from '../../../core/plugin'
import { loadScript } from '../../../lib/load-script'
import { lotameAnalytics, LotameProfile } from '..'

jest.mock('../../../lib/load-script', () => ({
  loadScript: jest.fn(() => Promise.resolve(document.createElement('script'))),
}))

const mockedLoadScript = loadScript as jest.MockedFunction<typeof loadScript>

function lotameCallback(clientId = '123') {
  return (window as any)[`lotame_${clientId}`].config.onProfileReady
}

function nativeProfile(audiences: unknown[] = ['a1'], panoramaId = 'pid-1') {
  return {
    getAudiences: () => audiences,
    getPanorama: () => ({
      getId: () => panoramaId,
    }),
  }
}

function storedProfile(overrides: Partial<LotameProfile> = {}): LotameProfile {
  return {
    audiences: ['a1'],
    panoramaId: 'pid-1',
    capturedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('Lotame Analytics plugin', () => {
  let analytics: Analytics

  beforeEach(() => {
    analytics = new Analytics({ writeKey: 'write-key' })
    mockedLoadScript.mockClear()
    cookie.remove('lotame_profile')
    window.localStorage.clear()
    delete (window as any).lotame_123
  })

  afterEach(() => {
    analytics.reset()
    cookie.remove('lotame_profile')
    window.localStorage.clear()
  })

  it('enriches traits from a valid cache hit without loading Lightning Tag', async () => {
    const profile = storedProfile()
    cookie.set('lotame_profile', JSON.stringify(profile))

    await analytics.register(lotameAnalytics({ clientId: '123' }))
    const ctx = await analytics.track('Viewed Page')

    expect(mockedLoadScript).not.toHaveBeenCalled()
    expect(ctx.event.context?.traits?.lotame).toEqual(profile)
  })

  it('falls back to localStorage when the cookie is absent', async () => {
    const profile = storedProfile()
    window.localStorage.setItem('lotame_profile', JSON.stringify(profile))

    await analytics.register(lotameAnalytics({ clientId: '123' }))
    const ctx = await analytics.track('Viewed Page')

    expect(mockedLoadScript).not.toHaveBeenCalled()
    expect(ctx.event.context?.traits?.lotame).toEqual(profile)
  })

  it('does not rewrite the cookie on cache hit', async () => {
    const profile = storedProfile()
    cookie.set('lotame_profile', JSON.stringify(profile))
    const setSpy = jest.spyOn(cookie, 'set')

    await analytics.register(lotameAnalytics({ clientId: '123' }))
    await analytics.track('Viewed Page')

    expect(
      setSpy.mock.calls.filter(([key]) => key === 'lotame_profile')
    ).toHaveLength(0)
    setSpy.mockRestore()
  })

  it('captures on cache miss, writes cache, and emits Lotame Enhanced Profile once', async () => {
    await analytics.register(lotameAnalytics({ clientId: '123' }))
    const trackSpy = jest.spyOn(analytics, 'track')

    expect(mockedLoadScript).toHaveBeenCalledWith(
      'https://tags.crwdcntrl.net/lt/c/123/lt.min.js'
    )

    lotameCallback()(nativeProfile(['aud-1', 'aud-2'], 'panorama-1'))
    await trackSpy.mock.results[0].value

    const cached = JSON.parse(cookie.get('lotame_profile') as string)
    expect(cached).toMatchObject({
      audiences: ['aud-1', 'aud-2'],
      panoramaId: 'panorama-1',
    })
    expect(typeof cached.capturedAt).toBe('string')
    expect(trackSpy).toHaveBeenCalledTimes(1)
    expect(trackSpy).toHaveBeenCalledWith('Lotame Enhanced Profile', cached)
  })

  it('keeps oversized profiles out of cookies and caches them in localStorage', async () => {
    await analytics.register(lotameAnalytics({ clientId: '123' }))
    const trackSpy = jest.spyOn(analytics, 'track')

    lotameCallback()(nativeProfile(['a'.repeat(4000)], 'panorama-1'))
    await trackSpy.mock.results[0].value

    expect(cookie.get('lotame_profile')).toBeUndefined()
    const cached = JSON.parse(
      window.localStorage.getItem('lotame_profile') as string
    )
    expect(cached.audiences[0]).toHaveLength(4000)
    expect(cached.panoramaId).toBe('panorama-1')
    expect(trackSpy).toHaveBeenCalledWith('Lotame Enhanced Profile', cached)
  })

  it('enriches events after async capture returns', async () => {
    await analytics.register(lotameAnalytics({ clientId: '123' }))

    const beforeCapture = await analytics.track('Before Capture')
    expect(beforeCapture.event.context?.traits?.lotame).toBeUndefined()

    lotameCallback()(nativeProfile(['aud-1'], 'panorama-1'))

    const afterCapture = await analytics.track('After Capture')

    expect(afterCapture.event.context?.traits?.lotame).toMatchObject({
      audiences: ['aud-1'],
      panoramaId: 'panorama-1',
    })
  })

  it('single-flights concurrent cache misses for the same client', async () => {
    const first = new Analytics({ writeKey: 'write-key-1' })
    const second = new Analytics({ writeKey: 'write-key-2' })

    await Promise.all([
      first.register(lotameAnalytics({ clientId: '123' })),
      second.register(lotameAnalytics({ clientId: '123' })),
    ])

    expect(mockedLoadScript).toHaveBeenCalledTimes(1)
    lotameCallback()(nativeProfile())
    first.reset()
    second.reset()
  })

  it('does not re-enter capture when the plugin emits its own event', async () => {
    await analytics.register(lotameAnalytics({ clientId: '123' }))
    const trackSpy = jest.spyOn(analytics, 'track')

    lotameCallback()(nativeProfile(['aud-1'], 'panorama-1'))
    await trackSpy.mock.results[0].value

    expect(trackSpy).toHaveBeenCalledTimes(1)
    expect(mockedLoadScript).toHaveBeenCalledTimes(1)
  })

  it('coexists with session enrichment — sessionId and lotame traits on same event', async () => {
    const sessionPlugin: Plugin = {
      name: 'session-enrichment',
      type: 'enrichment' as const,
      version: '0.1.0',
      isLoaded: () => true,
      load: () => Promise.resolve(),
      track: (ctx: Context) => {
        ctx.event.context = {
          ...ctx.event.context,
          sessionId: 'test-session-1',
        }
        return ctx
      },
    }

    await analytics.register(sessionPlugin)
    await analytics.register(lotameAnalytics({ clientId: '123' }))

    lotameCallback()(nativeProfile(['aud-1'], 'panorama-1'))
    await new Promise((r) => setTimeout(r, 50))

    const ctx = await analytics.track('Post Capture Event')

    expect(ctx.event.context?.sessionId).toBe('test-session-1')
    expect(ctx.event.context?.traits?.lotame).toMatchObject({
      audiences: ['aud-1'],
      panoramaId: 'panorama-1',
    })
  })

  it('is enrichment type and does not block event delivery on hook error', async () => {
    const plugin = lotameAnalytics({ clientId: '123' })
    expect(plugin.type).toBe('enrichment')

    const failingPlugin = {
      name: 'Failing Enrichment',
      type: 'enrichment' as const,
      version: '0.1.0',
      isLoaded: () => true,
      load: () => Promise.resolve(),
      track: () => {
        throw new Error('enrichment hook failure')
      },
    }

    await Promise.all([
      analytics.register(plugin),
      analytics.register(failingPlugin),
    ])

    lotameCallback()(nativeProfile(['aud-1'], 'panorama-1'))
    const ctx = await analytics.track('Survives Hook Error')

    expect(ctx.event.event).toBe('Survives Hook Error')
    expect(ctx.event.context?.traits?.lotame).toMatchObject({
      audiences: ['aud-1'],
      panoramaId: 'panorama-1',
    })
  })

  it('no-ops without clientId', async () => {
    const warnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)

    await analytics.register(lotameAnalytics({ clientId: '' }))
    const ctx = await analytics.track('Viewed Page')

    expect(ctx.event.context?.traits?.lotame).toBeUndefined()
    expect(mockedLoadScript).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(
      'Lotame Analytics: clientId is required'
    )
    warnSpy.mockRestore()
  })

  it('survives Lightning Tag load failure without breaking the pipeline (FR-13)', async () => {
    mockedLoadScript.mockRejectedValueOnce(
      new Error('Failed to load https://tags.crwdcntrl.net/lt/c/123/lt.min.js')
    )

    await analytics.register(lotameAnalytics({ clientId: '123' }))

    const ctx = await analytics.track('Survives Network Error')

    expect(ctx.event.event).toBe('Survives Network Error')
    expect(ctx.event.context?.traits?.lotame).toBeUndefined()
    expect(mockedLoadScript).toHaveBeenCalledTimes(1)
  })

  it('survives capture timeout without onProfileReady (FR-13)', async () => {
    await analytics.register(
      lotameAnalytics({ clientId: '123', captureTimeoutMs: 50 })
    )

    await new Promise((r) => setTimeout(r, 120))

    const ctx = await analytics.track('Survives Timeout')

    expect(ctx.event.event).toBe('Survives Timeout')
    expect(ctx.event.context?.traits?.lotame).toBeUndefined()
  })

  it('treats empty audiences and empty Panorama ID as a valid capture (FR-7)', async () => {
    await analytics.register(lotameAnalytics({ clientId: '123' }))
    const trackSpy = jest.spyOn(analytics, 'track')

    lotameCallback()(nativeProfile([], ''))

    await trackSpy.mock.results[0].value

    const cached = JSON.parse(cookie.get('lotame_profile') as string)
    expect(cached.audiences).toEqual([])
    expect(cached.panoramaId).toBe('')
    expect(typeof cached.capturedAt).toBe('string')
    expect(trackSpy).toHaveBeenCalledTimes(1)
    expect(trackSpy).toHaveBeenCalledWith('Lotame Enhanced Profile', cached)

    const ctx = await analytics.track('Empty Profile Event')
    expect(ctx.event.context?.traits?.lotame).toMatchObject({
      audiences: [],
      panoramaId: '',
    })
  })

  it('classifies an expired cookie as cache miss (FR-4)', async () => {
    const eightDaysAgo = new Date(
      Date.now() - 8 * 24 * 60 * 60 * 1000
    ).toISOString()
    cookie.set(
      'lotame_profile',
      JSON.stringify({
        audiences: ['stale-aud'],
        panoramaId: 'stale-pan',
        capturedAt: eightDaysAgo,
      })
    )

    await analytics.register(lotameAnalytics({ clientId: '123' }))

    expect(mockedLoadScript).toHaveBeenCalledTimes(1)
    expect(mockedLoadScript).toHaveBeenCalledWith(
      'https://tags.crwdcntrl.net/lt/c/123/lt.min.js'
    )
  })

  it('injects preconnect hints for Lotame CDN origins (NFR-2)', async () => {
    document.head.innerHTML = ''

    await analytics.register(lotameAnalytics({ clientId: '123' }))

    const preconnectLinks = document.head.querySelectorAll(
      'link[rel="preconnect"]'
    )
    const dnsPrefetchLinks = document.head.querySelectorAll(
      'link[rel="dns-prefetch"]'
    )

    const preconnectHrefs = Array.from(preconnectLinks).map((l) =>
      l.getAttribute('href')
    )
    const dnsPrefetchHrefs = Array.from(dnsPrefetchLinks).map((l) =>
      l.getAttribute('href')
    )

    expect(preconnectHrefs).toContain('https://tags.crwdcntrl.net')
    expect(preconnectHrefs).toContain('https://bcp.crwdcntrl.net')
    expect(preconnectHrefs).toContain('https://c.ltmsphrcl.net')
    expect(dnsPrefetchHrefs).toContain('https://tags.crwdcntrl.net')
    expect(dnsPrefetchHrefs).toContain('https://bcp.crwdcntrl.net')
    expect(dnsPrefetchHrefs).toContain('https://c.ltmsphrcl.net')
  })
})
