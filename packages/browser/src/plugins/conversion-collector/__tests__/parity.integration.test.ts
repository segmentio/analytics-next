import { AnalyticsBrowser } from '../../../browser'
import { envEnrichment } from '../../env-enrichment'
import { conversionCdnSettingsMinimal, conversionPipelinePlugins } from '..'
import { getOrCreateSessionId, SESSION_INACTIVITY_TTL_MS } from '../lib/session'
import {
  ACTIVITY_COOKIE,
  SESSION_COOKIE,
} from '../session-enrichment/session-manager'
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

describe('Conversion pipeline — native collect contract', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    global.fetch = fetchMock
    window.localStorage.clear()
    document.cookie = ''
    setupBrowserWindow('/path', '?utm_source=test')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sends native analytics-next array with sessionId and campaign context', async () => {
    const [analytics] = await AnalyticsBrowser.load(
      {
        writeKey: 'conversion-pipeline',
        cdnSettings: conversionCdnSettingsMinimal,
        plugins: [
          envEnrichment,
          ...conversionPipelinePlugins({
            endpoint: COLLECTOR_ENDPOINT,
            appName: 'test-app',
            retryAttempts: 0,
            flushIntervalMs: 60_000,
            batchSize: 10,
          }),
        ],
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
    const body = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1]?.body)
    ) as Array<{
      type: string
      event?: string
      anonymousId: string
      userId?: string
      traits?: Record<string, unknown>
      properties?: Record<string, unknown>
      context: Record<string, unknown>
      messageId: string
      sentAt?: string
    }>

    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(2)
    const trackEvent = body[0]!
    const identifyEvent = body[1]!

    expect(trackEvent.type).toBe('track')
    expect(trackEvent.event).toBe('quiz_started')
    expect(identifyEvent.type).toBe('identify')
    expect(identifyEvent.userId).toBe('user-1')
    expect(isValidUuidV4(trackEvent.anonymousId)).toBe(true)
    expect(typeof trackEvent.messageId).toBe('string')
    expect((trackEvent.messageId ?? '').length).toBeGreaterThan(0)
    expect(typeof trackEvent.sentAt).toBe('string')

    expect(typeof trackEvent.context.sessionId).toBe('string')
    expect(trackEvent.context.session_id).toBeUndefined()
    expect((trackEvent.context.campaign as { source?: string })?.source).toBe(
      'test'
    )
    expect(trackEvent.properties?.quizId).toBe('q1')

    const identifyTraits = identifyEvent.traits as Record<string, unknown>
    expect(identifyTraits.email).toBe('a@test.com')
    expect(identifyTraits.email_domain).toBe('test.com')
  })

  it('enriches page events with taxonomy when enablePageTaxonomy is on', async () => {
    setupBrowserWindow(
      '/usa-cc-mastercardbuilt-p1',
      '?utm_source=google&gclid=abc'
    )

    const [analytics] = await AnalyticsBrowser.load(
      {
        writeKey: 'conversion-pipeline',
        cdnSettings: conversionCdnSettingsMinimal,
        plugins: [
          envEnrichment,
          ...conversionPipelinePlugins({
            endpoint: COLLECTOR_ENDPOINT,
            retryAttempts: 0,
            flushIntervalMs: 60_000,
            batchSize: 10,
            getVisitorCountry: () => 'BR',
            enablePageTaxonomy: true,
          }),
        ],
      },
      { integrations: { 'Segment.io': false } }
    )

    await analytics.page({ custom: true })
    await analytics.identify('u', { email: 'x@y.com' })

    const body = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1]?.body)
    ) as Array<{
      type: string
      properties?: Record<string, unknown>
      context: { campaign?: Record<string, unknown> }
    }>
    const pageEvent = body[0]
    const pageProps = pageEvent?.properties
    expect(pageEvent?.type).toBe('page')
    expect(pageProps?.utm_source).toBe('google')
    expect(pageProps?.visitor_country).toBe('BR')
    expect(pageProps?.country).toBe('usa')
    expect(pageProps?.vertical).toBe('cc')
    expect(pageProps?.product).toBe('mastercardbuilt')
    expect(pageProps?.funnel).toBe('p1')
    expect(pageProps?.custom).toBe(true)
    expect(pageEvent?.context.campaign?.gclid).toBe('abc')
  })

  it('reuses session within inactivity window and rotates after expiry', () => {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`
    document.cookie = `${ACTIVITY_COOKIE}=; path=/; max-age=0; SameSite=Lax`

    const first = getOrCreateSessionId()
    const second = getOrCreateSessionId()
    expect(second).toBe(first)

    const staleActivity = String(Date.now() - SESSION_INACTIVITY_TTL_MS - 1000)
    document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(
      first
    )}; path=/; max-age=3600; SameSite=Lax`
    document.cookie = `${ACTIVITY_COOKIE}=${encodeURIComponent(
      staleActivity
    )}; path=/; max-age=3600; SameSite=Lax`

    const rotated = getOrCreateSessionId()
    expect(rotated).not.toBe(first)
    expect(isValidUuidV4(rotated)).toBe(true)
  })
})
