import { getOrCreateAnonymousId } from '../../plugins/conversion-collector/lib/session'
import { isValidUuidV4 } from '../../plugins/conversion-collector/lib/uuid'
import {
  attachToWindow,
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
    init({
      endpoint: '/collector',
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

  it('flushes identify immediately and uses segment-like payload fields', async () => {
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
    const body = JSON.parse(String(options?.body)) as {
      events: Array<{
        type: string
        event_name?: string
        anonymous_id: string
        user_id?: string
        traits?: Record<string, unknown>
        message_id: string
        original_timestamp: string
        sent_at?: string
        version: number
        properties?: Record<string, unknown>
        context: Record<string, unknown>
      }>
    }
    expect(body.events.length).toBe(2)
    expect(body.events[0]?.type).toBe('track')
    expect(body.events[1]?.type).toBe('identify')
    expect(body.events[0]?.event_name).toBe('quiz_started')
    expect(typeof body.events[0]?.anonymous_id).toBe('string')
    expect(typeof body.events[1]?.anonymous_id).toBe('string')
    expect(body.events[1]?.user_id).toBe('user-1')
    const identifyTraits = body.events[1]?.traits
    expect(String(identifyTraits?.email)).toMatch(/^[a-f0-9]{64}$/)
    expect(identifyTraits?.email).toBe(identifyTraits?.email_hash)
    expect(identifyTraits?.email_domain).toBe('test.com')
    expect(body.events[0]?.version).toBe(2)
    expect(typeof body.events[0]?.message_id).toBe('string')
    expect(typeof body.events[0]?.original_timestamp).toBe('string')
    expect(typeof body.events[0]?.sent_at).toBe('string')
    expect(body.events[0]?.properties?.event_name).toBeUndefined()
    expect(body.events[0]?.properties?.eventName).toBeUndefined()
    expect(typeof body.events[0]?.context.session_id).toBe('string')
    expect(body.events[0]?.context.app).toEqual({ name: 'test-app' })
    expect(body.events[0]?.context.channel).toBe('browser')
    const library = body.events[0]?.context.library as {
      name?: string
      version?: string
    }
    expect(library?.name).toBe('conversion-analytics-sdk')
    expect(typeof library?.version).toBe('string')
    const page0 = body.events[0]?.context.page as {
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
    expect(body.events[0]?.context.locale).toBe('en-US')
    expect(body.events[0]?.context.screen).toEqual({ width: 1280, height: 720 })
    expect(body.events[0]?.context.userAgent).toBe('node-test-agent')
  })

  it('includes userId and traits on track events after identify', async () => {
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
    const body = JSON.parse(String(options?.body)) as {
      events: Array<{
        type: string
        user_id?: string
        context?: Record<string, unknown>
      }>
    }
    expect(body.events[0]?.type).toBe('track')
    expect(body.events[0]?.user_id).toBe('known-user')
    const trackTraits = body.events[0]?.context?.traits as
      | Record<string, unknown>
      | undefined
    expect(String(trackTraits?.email)).toMatch(/^[a-f0-9]{64}$/)
    expect(trackTraits?.email_domain).toBe('test.com')
  })

  it('uses the real event_name and strips it from properties', async () => {
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
    const body = JSON.parse(String(options?.body)) as {
      events: Array<{
        event_name?: string
        properties?: Record<string, unknown>
      }>
    }
    expect(body.events[0]?.event_name).toBe('impression_viewable')
    expect(body.events[0]?.properties?.answer).toBe('A')
    expect(body.events[0]?.properties?.query_params).toEqual({
      utm_source: 'test',
    })
  })

  it('attaches sdk to window', () => {
    attachToWindow('ConversionAnalytics')
    const analytics = (window as unknown as Record<string, unknown>)
      .ConversionAnalytics as Record<string, unknown> | undefined
    expect(analytics).toBeTruthy()
    expect(typeof analytics?.track).toBe('function')
    expect(typeof analytics?.page).toBe('function')
  })

  it('returns debug info for copy workflows', async () => {
    await track('debug_event', {})
    const info = getDebugInfo()
    expect(info.endpoint).toBe('/collector')
    expect(typeof info.sessionId).toBe('string')
    expect(info.queueSize).toBe(1)
  })

  it('uses UUID v4 for anonymous_id and message_id', async () => {
    ;(
      window as unknown as { localStorage: { store: Record<string, string> } }
    ).localStorage.store['__bg_analytics_anonymous_id'] = 'legacy-not-uuid'

    await track('uuid_check', {})
    await flush()

    const [, options] = fetchCalls[0] as [
      RequestInfo | URL,
      RequestInit | undefined
    ]
    const body = JSON.parse(String(options?.body)) as {
      events: Array<{ anonymous_id: string; message_id: string }>
    }
    expect(isValidUuidV4(body.events[0]?.anonymous_id ?? '')).toBe(true)
    expect(isValidUuidV4(body.events[0]?.message_id ?? '')).toBe(true)
    expect(isValidUuidV4(getOrCreateAnonymousId())).toBe(true)
  })

  it('enriches page with query_params and URL taxonomy', async () => {
    installBrowserGlobals({
      location: {
        href: 'https://example.com/usa-cc-mastercardbuilt-p1?utm_source=google&gclid=abc',
        pathname: '/usa-cc-mastercardbuilt-p1',
        search: '?utm_source=google&gclid=abc',
      },
    })

    resetAnalyticsSingleton({
      endpoint: '/collector',
      flushIntervalMs: 10000,
      batchSize: 10,
      retryAttempts: 0,
      enableGptSlotEvents: false,
      getVisitorCountry: () => 'BR',
    })

    await track('page', { custom: true })
    await track('after_page', {})
    await flush()

    const [, options] = fetchCalls[0] as [
      RequestInfo | URL,
      RequestInit | undefined
    ]
    const body = JSON.parse(String(options?.body)) as {
      events: Array<{
        event_name?: string
        properties?: Record<string, unknown>
      }>
    }
    const pageProps = body.events[0]?.properties
    expect(body.events[0]?.event_name).toBe('page')
    expect(pageProps?.query_params).toEqual({
      utm_source: 'google',
      gclid: 'abc',
    })
    expect(pageProps?.utm_source).toBe('google')
    expect(pageProps?.gclid).toBe('abc')
    expect(pageProps?.page_path).toBe('/usa-cc-mastercardbuilt-p1')
    expect(pageProps?.visitor_country).toBe('BR')
    expect(pageProps?.country).toBe('usa')
    expect(pageProps?.vertical).toBe('cc')
    expect(pageProps?.product).toBe('mastercardbuilt')
    expect(pageProps?.funnel).toBe('p1')
    expect(pageProps?.custom).toBe(true)

    const afterPageProps = body.events[1]?.properties
    expect(afterPageProps?.query_params).toEqual({
      utm_source: 'google',
      gclid: 'abc',
    })
    expect(afterPageProps?.utm_source).toBe('google')
  })

  it('sets visitor_country from navigator.language when hook is absent', async () => {
    installBrowserGlobals({
      navigator: { language: 'pt-BR' },
    })
    resetAnalyticsSingleton({
      endpoint: '/collector',
      flushIntervalMs: 10000,
      batchSize: 10,
      retryAttempts: 0,
      enableGptSlotEvents: false,
    })

    await track('page', {})
    await flush()

    const [, options] = fetchCalls[0] as [
      RequestInfo | URL,
      RequestInit | undefined
    ]
    const body = JSON.parse(String(options?.body)) as {
      events: Array<{ properties?: Record<string, unknown> }>
    }
    expect(body.events[0]?.properties?.visitor_country).toBe('BR')
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
    resetAnalyticsSingleton({
      endpoint: '/collector',
      flushIntervalMs: 10000,
      batchSize: 10,
      retryAttempts: 0,
      enableGptSlotEvents: false,
    })

    await track('failed_event', {})
    await flush().catch(() => undefined)
    expect(getQueueSize()).toBe(1)
  })
})
