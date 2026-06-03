import { AnalyticsBrowser } from '../../../browser'
import { conversionCdnSettingsMinimal, conversionPipelinePlugins } from '..'
import { getOrCreateSessionId, SESSION_INACTIVITY_TTL_MS } from '../lib/session'
import { isValidUuidV4 } from '../lib/uuid'

const COLLECTOR_ENDPOINT = 'https://collector.test/events'

function setupBrowserWindow(pathname: string, search: string) {
  window.history.replaceState({}, '', `${pathname}${search}`)
  const storageMock = () => ({
    store: {} as Record<string, string>,
    getItem(key: string) {
      return this.store[key] ?? null
    },
    setItem(key: string, value: string) {
      this.store[key] = value
    },
    clear() {
      this.store = {}
    },
  })
  Object.defineProperty(window, 'sessionStorage', {
    value: storageMock(),
    writable: true,
    configurable: true,
  })
  Object.defineProperty(window, 'localStorage', {
    value: storageMock(),
    writable: true,
    configurable: true,
  })
  const query = search.startsWith('?') ? search.slice(1) : search
  const captured = Object.fromEntries(new URLSearchParams(query).entries())
  window.sessionStorage.setItem(
    '__bg_analytics_query_params',
    JSON.stringify(captured)
  )
  Object.defineProperty(window, 'screen', {
    value: { width: 1280, height: 720 },
    writable: true,
    configurable: true,
  })
  Object.defineProperty(document, 'referrer', {
    value: 'https://ref.example.com',
    writable: true,
    configurable: true,
  })
  Object.defineProperty(document, 'title', {
    value: 'Test page',
    writable: true,
    configurable: true,
  })
  Object.defineProperty(navigator, 'language', {
    value: 'en-US',
    writable: true,
    configurable: true,
  })
  Object.defineProperty(navigator, 'userAgent', {
    value: 'node-test-agent',
    writable: true,
    configurable: true,
  })
}

describe('Conversion pipeline parity with conversion-analytics-sdk', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    global.fetch = fetchMock
    window.localStorage.clear()
    setupBrowserWindow('/path', '?utm_source=test')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('produces collector envelopes aligned with the legacy SDK contract', async () => {
    const [analytics] = await AnalyticsBrowser.load(
      {
        writeKey: 'conversion-pipeline',
        cdnSettings: conversionCdnSettingsMinimal,
        plugins: conversionPipelinePlugins({
          endpoint: COLLECTOR_ENDPOINT,
          appName: 'test-app',
          retryAttempts: 0,
          flushIntervalMs: 60_000,
          batchSize: 10,
        }),
      },
      {
        integrations: { 'Segment.io': false },
        globalAnalyticsKey: 'ConversionAnalytics',
      }
    )

    await analytics.track('quiz_started', { quizId: 'q1' })
    await analytics.identify('user-1', {
      email: 'a@test.com',
      email_domain: 'test.com',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      events: Array<{
        type: string
        event_name?: string
        anonymous_id: string
        user_id?: string
        traits?: Record<string, unknown>
        properties?: Record<string, unknown>
        context: Record<string, unknown>
        version: number
        message_id: string
        sent_at?: string
      }>
    }

    expect(body.events).toHaveLength(2)
    const trackEvent = body.events[0]!
    const identifyEvent = body.events[1]!

    expect(trackEvent.type).toBe('track')
    expect(trackEvent.event_name).toBe('quiz_started')
    expect(identifyEvent.type).toBe('identify')
    expect(identifyEvent.user_id).toBe('user-1')
    expect(trackEvent.version).toBe(2)
    expect(isValidUuidV4(trackEvent.anonymous_id)).toBe(true)
    expect(isValidUuidV4(trackEvent.message_id)).toBe(true)
    expect(typeof trackEvent.sent_at).toBe('string')

    expect(trackEvent.context.app).toEqual({ name: 'test-app' })
    expect(trackEvent.context.channel).toBe('browser')
    expect(trackEvent.context.library).toMatchObject({
      name: 'conversion-analytics-sdk',
    })
    expect(typeof trackEvent.context.session_id).toBe('string')
    expect(trackEvent.properties?.quizId).toBe('q1')
    expect(trackEvent.properties?.query_params).toEqual({ utm_source: 'test' })

    const identifyTraits = identifyEvent.traits as Record<string, unknown>
    expect(String(identifyTraits.email)).toMatch(/^[a-f0-9]{64}$/)
    expect(identifyTraits.email).toBe(identifyTraits.email_hash)
    expect(identifyTraits.email_domain).toBe('test.com')
  })

  it('enriches page events with taxonomy and visitor_country', async () => {
    setupBrowserWindow(
      '/usa-cc-mastercardbuilt-p1',
      '?utm_source=google&gclid=abc'
    )

    const [analytics] = await AnalyticsBrowser.load(
      {
        writeKey: 'conversion-pipeline',
        cdnSettings: conversionCdnSettingsMinimal,
        plugins: conversionPipelinePlugins({
          endpoint: COLLECTOR_ENDPOINT,
          retryAttempts: 0,
          flushIntervalMs: 60_000,
          batchSize: 10,
          getVisitorCountry: () => 'BR',
        }),
      },
      { integrations: { 'Segment.io': false } }
    )

    await analytics.page({ custom: true })
    await analytics.identify('u', { email: 'x@y.com' })

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      events: Array<{
        event_name?: string
        properties?: Record<string, unknown>
      }>
    }
    const pageProps = body.events[0]?.properties
    expect(body.events[0]?.event_name).toBe('page')
    expect(pageProps?.utm_source).toBe('google')
    expect(pageProps?.gclid).toBe('abc')
    expect(pageProps?.visitor_country).toBe('BR')
    expect(pageProps?.country).toBe('usa')
    expect(pageProps?.vertical).toBe('cc')
    expect(pageProps?.product).toBe('mastercardbuilt')
    expect(pageProps?.funnel).toBe('p1')
    expect(pageProps?.custom).toBe(true)
  })

  it('reuses session_id within inactivity window and rotates after expiry', () => {
    document.cookie =
      '__bg_analytics_session_id=; path=/; max-age=0; SameSite=Lax'
    document.cookie =
      '__bg_analytics_session_activity=; path=/; max-age=0; SameSite=Lax'

    const first = getOrCreateSessionId()
    const second = getOrCreateSessionId()
    expect(second).toBe(first)

    const staleActivity = String(Date.now() - SESSION_INACTIVITY_TTL_MS - 1000)
    document.cookie = `__bg_analytics_session_id=${encodeURIComponent(
      first
    )}; path=/; max-age=3600; SameSite=Lax`
    document.cookie = `__bg_analytics_session_activity=${encodeURIComponent(
      staleActivity
    )}; path=/; max-age=3600; SameSite=Lax`

    const rotated = getOrCreateSessionId()
    expect(rotated).not.toBe(first)
    expect(isValidUuidV4(rotated)).toBe(true)
  })
})
