import { getOrCreateAnonymousId } from '../../plugins/conversion-collector/lib/session'
import { isValidUuidV4 } from '../../plugins/conversion-collector/lib/uuid'
import {
  attachToWindow,
  bootstrapConversionAnalyticsFromWindow,
  flush,
  getDebugInfo,
  getQueueSize,
  identify,
  init,
  stop,
  track,
} from '../index'
import { resetAnalyticsSingleton } from '../singleton'
import { installBrowserGlobals } from './browser-globals'

let fetchCalls: Array<[RequestInfo | URL, RequestInit | undefined]> = []

type CollectPayload = Array<{
  type: string
  event?: string
  anonymousId: string
  userId?: string
  traits?: Record<string, unknown>
  messageId: string
  timestamp?: string
  originalTimestamp?: string
  original_timestamp?: string
  sentAt?: string
  properties?: Record<string, unknown>
  context: Record<string, unknown>
  _metadata?: { retryCount?: number }
}>

describe('Conversion SDK public API', () => {
  beforeEach(() => {
    resetAnalyticsSingleton()
    fetchCalls = []
    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        fetchCalls.push([input, init])
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
        } as Response
      }
    )
    installBrowserGlobals()
    init('conversion-pipeline', {
      appName: 'test-app',
      flushIntervalMs: 10000,
      batchSize: 10,
      retryAttempts: 0,
      enableGptSlotEvents: false,
    })
  })

  afterEach(async () => {
    try {
      await stop()
    } catch {
      // init may not have completed
    }
  })

  it('flushes identify immediately with native analytics-next payload', async () => {
    await track('quiz_started', { step: 1 })
    await identify('user-1', { email: 'a@test.com', email_domain: 'test.com' })

    expect(getQueueSize()).toBe(0)
    expect(fetchCalls.length).toBe(1)

    const [url, options] = fetchCalls[0] as [
      RequestInfo | URL,
      RequestInit | undefined
    ]
    expect(url).toBe('/collector')
    expect(options?.method).toBe('POST')
    const body = JSON.parse(String(options?.body)) as CollectPayload

    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBe(2)
    expect(body[0]?.type).toBe('track')
    expect(body[1]?.type).toBe('identify')
    expect(body[0]?.event).toBe('quiz_started')
    expect(typeof body[0]?.anonymousId).toBe('string')
    expect(typeof body[1]?.anonymousId).toBe('string')
    expect(body[1]?.userId).toBe('user-1')
    const identifyTraits = body[1]?.traits
    expect(identifyTraits?.email).toBe('a@test.com')
    expect(identifyTraits?.email_domain).toBe('test.com')
    expect(typeof body[0]?.messageId).toBe('string')
    expect(typeof body[0]?.timestamp).toBe('string')
    expect(typeof body[0]?.sentAt).toBe('string')
    expect(body[0]?._metadata?.retryCount).toBe(0)
    expect(body[0]?.properties?.eventName).toBeUndefined()
    expect(typeof body[0]?.context.sessionId).toBe('string')
    expect(body[0]?.context.session_id).toBeUndefined()

    const page0 = body[0]?.context.page as {
      path?: string
      search?: string
      url?: string
      title?: string
      referrer?: string
    }
    expect(page0?.path).toBe('/path')
    expect(page0?.search).toBe('?utm_source=test')
    expect(page0?.url).toBe('https://example.com/path?utm_source=test')
    expect(page0?.title).toBe('Test page')
    expect(page0?.referrer).toBe('https://ref.example.com')
    expect(body[0]?.context.locale).toBe('en-US')
    expect(body[0]?.context.userAgent).toBe('node-test-agent')
    expect((body[0]?.context.campaign as { source?: string })?.source).toBe(
      'test'
    )
  })

  it('includes userId on track events after identify', async () => {
    await identify('known-user', {
      email: 'known@test.com',
      email_domain: 'test.com',
    })
    await track('after_identify', {})
    await flush()
    expect(fetchCalls.length).toBe(2)
    const [, options] = fetchCalls[1] as [
      RequestInfo | URL,
      RequestInit | undefined
    ]
    const body = JSON.parse(String(options?.body)) as CollectPayload
    expect(body[0]?.type).toBe('track')
    expect(body[0]?.userId).toBe('known-user')
  })

  it('uses the real event name and strips aliases from properties', async () => {
    await track({
      eventName: 'impression_viewable',
      eventData: {
        answer: 'A',
        event_name: 'ads',
        eventName: 'slot_request_received',
      },
    })
    await flush()
    const [, options] = fetchCalls[0] as [
      RequestInfo | URL,
      RequestInit | undefined
    ]
    const body = JSON.parse(String(options?.body)) as CollectPayload
    expect(body[0]?.event).toBe('impression_viewable')
    expect(body[0]?.properties?.answer).toBe('A')
    expect(body[0]?.properties?.event_name).toBeUndefined()
    expect(body[0]?.properties?.eventName).toBeUndefined()
  })

  it('attaches MVP sdk to window', () => {
    attachToWindow('ConversionAnalytics')
    const analytics = (window as unknown as Record<string, unknown>)
      .ConversionAnalytics as Record<string, unknown> | undefined
    expect(analytics).toBeTruthy()
    expect(typeof analytics?.track).toBe('function')
    expect(typeof analytics?.page).toBe('function')
    expect(typeof analytics?.init).toBe('function')
    expect(analytics?.flush).toBeUndefined()
  })

  it('bootstraps the full global contract on window.analytics and aliases', async () => {
    resetAnalyticsSingleton()
    ;(window as unknown as Record<string, unknown>).analytics = {
      writeKey: 'conversion-pipeline',
      config: {
        appName: 'test-app',
        flushIntervalMs: 10000,
        batchSize: 10,
        retryAttempts: 0,
        enableGptSlotEvents: false,
      },
      queue: [],
    }

    await bootstrapConversionAnalyticsFromWindow()

    const w = window as unknown as Record<string, Record<string, unknown>>
    const analytics = w.analytics
    expect(analytics).toBe(w._analytics)
    expect(analytics).toBe(w.ConversionAnalytics)
    expect(analytics).toBe(w._ConversionAnalytics)
    expect(typeof analytics?.init).toBe('function')
    expect(typeof analytics?.track).toBe('function')
    expect(typeof analytics?.identify).toBe('function')
    expect(typeof analytics?.page).toBe('function')
    expect(analytics?.loaded).toBe(true)
    expect(analytics?.writeKey).toBe('conversion-pipeline')
    expect(typeof analytics?._sessionId).toBe('string')
  })

  it('prefers configured ConversionAnalytics stub over existing analytics global', async () => {
    resetAnalyticsSingleton()
    ;(window as unknown as Record<string, unknown>).analytics = {
      existing: true,
    }
    ;(window as unknown as Record<string, unknown>).ConversionAnalytics = {
      config: {
        endpoint: 'https://pipeline.utua.africa',
        appName: 'strapi-quiz',
        flushIntervalMs: 10000,
        batchSize: 1,
        retryAttempts: 0,
      },
      queue: [
        { type: 'track', arguments: ['quiz_started', { quizId: 'quiz' }] },
      ],
    }

    await bootstrapConversionAnalyticsFromWindow()

    expect(fetchCalls.length).toBeGreaterThan(0)
    expect(fetchCalls.map(([url]) => url)).toEqual(
      expect.arrayContaining(['https://pipeline.utua.africa'])
    )
    expect(
      fetchCalls.every(([url]) => url === 'https://pipeline.utua.africa')
    ).toBe(true)
    const analytics = (
      window as unknown as Record<string, Record<string, unknown>>
    ).ConversionAnalytics
    expect(analytics?.config).toMatchObject({
      endpoint: 'https://pipeline.utua.africa',
      appName: 'strapi-quiz',
    })
  })

  it('returns debug info for copy workflows', async () => {
    await track('debug_event', {})
    const info = getDebugInfo()
    expect(info.endpoint).toBe('/collector')
    expect(typeof info.sessionId).toBe('string')
    expect(info.queueSize).toBe(1)
  })

  it('uses UUID v4 for anonymousId and messageId', async () => {
    await track('uuid_check', {})
    await flush()

    const [, options] = fetchCalls[0] as [
      RequestInfo | URL,
      RequestInit | undefined
    ]
    const body = JSON.parse(String(options?.body)) as CollectPayload
    expect(isValidUuidV4(body[0]?.anonymousId ?? '')).toBe(true)
    expect((body[0]?.messageId ?? '').length).toBeGreaterThan(0)
    expect(isValidUuidV4(getOrCreateAnonymousId())).toBe(true)
  })

  it('enriches page with taxonomy when enablePageTaxonomy is on', async () => {
    installBrowserGlobals({
      location: {
        href: 'https://example.com/usa-cc-mastercardbuilt-p1?utm_source=google&gclid=abc&fbclid=fb&ttclid=tt&msclkid=ms&twclid=tw',
        pathname: '/usa-cc-mastercardbuilt-p1',
        search:
          '?utm_source=google&gclid=abc&fbclid=fb&ttclid=tt&msclkid=ms&twclid=tw',
      },
    })

    resetAnalyticsSingleton('conversion-pipeline', {
      flushIntervalMs: 10000,
      batchSize: 10,
      retryAttempts: 0,
      enableGptSlotEvents: false,
      enablePageTaxonomy: true,
      getVisitorCountry: () => 'BR',
    })

    await track('page', { custom: true })
    await track('after_page', {})
    await flush()

    const [, options] = fetchCalls[0] as [
      RequestInfo | URL,
      RequestInit | undefined
    ]
    const body = JSON.parse(String(options?.body)) as CollectPayload
    const pageProps = body[0]?.properties
    expect(body[0]?.type).toBe('track')
    expect(body[0]?.event).toBe('page')
    expect(pageProps?.utm_source).toBe('google')
    expect(pageProps?.gclid).toBe('abc')
    expect(pageProps?.page_path).toBe('/usa-cc-mastercardbuilt-p1')
    expect(pageProps?.visitor_country).toBe('BR')
    expect(pageProps?.country).toBe('usa')
    expect(pageProps?.vertical).toBe('cc')
    expect(pageProps?.product).toBe('mastercardbuilt')
    expect(pageProps?.funnel).toBe('p1')
    expect(pageProps?.custom).toBe(true)

    const pageContext = body[0]?.context as {
      campaign?: {
        source?: string
        gclid?: string
        fbclid?: string
        ttclid?: string
        msclkid?: string
        twclid?: string
      }
    }
    expect(pageContext.campaign?.source).toBe('google')
    expect(pageContext.campaign?.gclid).toBe('abc')
    expect(pageContext.campaign?.fbclid).toBe('fb')
    expect(pageContext.campaign?.ttclid).toBe('tt')
    expect(pageContext.campaign?.msclkid).toBe('ms')
    expect(pageContext.campaign?.twclid).toBe('tw')
  })

  it('requeues batch when request fails', async () => {
    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        fetchCalls.push([input, init])
        return {
          ok: false,
          status: 500,
          headers: new Headers(),
        } as Response
      }
    )
    resetAnalyticsSingleton('conversion-pipeline', {
      flushIntervalMs: 10000,
      batchSize: 10,
      retryAttempts: 0,
      enableGptSlotEvents: false,
    })

    await track('failed_event', {})
    await flush().catch(() => undefined)
    expect(getQueueSize()).toBe(1)
  })

  it.each([
    ['gclid', 'gclid'],
    ['fbclid', 'fbclid'],
    ['ttclid', 'ttclid'],
    ['tt_clid', 'ttclid'],
    ['msclkid', 'msclkid'],
    ['twclid', 'twclid'],
  ])(
    'enriches context.campaign with %s click-id',
    async (paramKey, campaignKey) => {
      resetAnalyticsSingleton('conversion-pipeline', {
        flushIntervalMs: 10000,
        batchSize: 10,
        retryAttempts: 0,
        enableGptSlotEvents: false,
      })
      installBrowserGlobals({
        location: {
          href: `https://example.com/?${paramKey}=test-val`,
          pathname: '/',
          search: `?${paramKey}=test-val`,
        },
      })

      await track('click_test', {})
      await flush()

      const [, options] = fetchCalls[0] as [
        RequestInfo | URL,
        RequestInit | undefined
      ]
      const body = JSON.parse(String(options?.body)) as CollectPayload
      const campaign = body[0]?.context?.campaign as Record<string, string>
      expect(campaign[campaignKey]).toBe('test-val')
    }
  )

  it('enriches events with lotame traits when lotameClientId is configured', async () => {
    const profile = {
      audiences: ['aud-wiring-1'],
      panoramaId: 'pan-wiring-1',
      capturedAt: new Date().toISOString(),
    }
    localStorage.setItem('lotame_profile', JSON.stringify(profile))

    resetAnalyticsSingleton('conversion-pipeline', {
      flushIntervalMs: 10000,
      batchSize: 10,
      retryAttempts: 0,
      enableGptSlotEvents: false,
      lotameClientId: 'test-lotame',
    })

    await track('lotame_wiring_test', {})
    await flush()

    expect(fetchCalls.length).toBeGreaterThanOrEqual(1)
    const [, options] = fetchCalls[0] as [
      RequestInfo | URL,
      RequestInit | undefined
    ]
    const body = JSON.parse(String(options?.body)) as CollectPayload
    const lotameTraits = body[0]?.context?.traits as
      | { lotame?: { audiences?: unknown[]; panoramaId?: string } }
      | undefined
    expect(lotameTraits?.lotame?.audiences).toEqual(['aud-wiring-1'])
    expect(lotameTraits?.lotame?.panoramaId).toBe('pan-wiring-1')

    localStorage.removeItem('lotame_profile')
  })
})
