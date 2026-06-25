import { AnalyticsBrowser } from '../../../browser'
import { envEnrichment } from '../../env-enrichment'
import {
  conversionCdnSettingsMinimal,
  conversionCollectorPlugin,
  sessionEnrichment,
} from '..'

const COLLECTOR_ENDPOINT = 'https://collector.test/events'

describe('Conversion Collector plugin', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    global.fetch = fetchMock
    window.localStorage.clear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('posts batched track and identify as native array without calling Segment.io', async () => {
    const collector = conversionCollectorPlugin({
      endpoint: COLLECTOR_ENDPOINT,
      retryAttempts: 0,
      flushIntervalMs: 60_000,
      batchSize: 10,
    })

    const [analytics] = await AnalyticsBrowser.load(
      {
        writeKey: 'conversion-pipeline',
        cdnSettings: conversionCdnSettingsMinimal,
        plugins: [
          envEnrichment,
          sessionEnrichment({ endpoint: COLLECTOR_ENDPOINT }),
          collector,
        ],
      },
      {
        integrations: { 'Segment.io': false },
      }
    )

    await analytics.track('quiz_started', { quizId: 'q1' })
    await analytics.identify('user-1', { email: 'a@test.com' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(COLLECTOR_ENDPOINT)
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })

    const body = JSON.parse(String(init.body)) as Array<{
      type: string
      event?: string
      anonymousId: string
      userId?: string
      sentAt?: string
      context: { sessionId?: string }
      _metadata?: { retryCount?: number }
    }>

    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(2)
    expect(body[0]?.type).toBe('track')
    expect(body[0]?.event).toBe('quiz_started')
    expect(body[1]?.type).toBe('identify')
    expect(body[1]?.userId).toBe('user-1')
    expect(typeof body[0]?.anonymousId).toBe('string')
    expect(typeof body[0]?.sentAt).toBe('string')
    expect(typeof body[0]?.context.sessionId).toBe('string')
    expect(body[0]?._metadata?.retryCount).toBe(0)

    const segmentCalls = fetchMock.mock.calls.filter(([callUrl]) =>
      String(callUrl).includes('api.segment.io')
    )
    expect(segmentCalls).toHaveLength(0)
  })

  it('flushes pending events when visibilitychange moves to hidden', async () => {
    Object.defineProperty(navigator, 'sendBeacon', {
      value: () => false,
      configurable: true,
    })
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    })

    const collector = conversionCollectorPlugin({
      endpoint: COLLECTOR_ENDPOINT,
      retryAttempts: 0,
      flushIntervalMs: 60_000,
      batchSize: 10,
    })

    const [analytics] = await AnalyticsBrowser.load(
      {
        writeKey: 'conversion-pipeline',
        cdnSettings: conversionCdnSettingsMinimal,
        plugins: [
          envEnrichment,
          sessionEnrichment({ endpoint: COLLECTOR_ENDPOINT }),
          collector,
        ],
      },
      {
        integrations: { 'Segment.io': false },
      }
    )

    await analytics.track('hidden_flush', {})
    expect(fetchMock).not.toHaveBeenCalled()

    document.dispatchEvent(new Event('visibilitychange'))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(fetchMock).toHaveBeenCalledWith(
      COLLECTOR_ENDPOINT,
      expect.objectContaining({ keepalive: true })
    )
    const body = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1]?.body)
    ) as Array<{
      event?: string
    }>
    expect(body[0]?.event).toBe('hidden_flush')
  })
})
