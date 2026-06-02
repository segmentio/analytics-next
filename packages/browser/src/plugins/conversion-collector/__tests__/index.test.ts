import { AnalyticsBrowser } from '../../../browser'
import { conversionCdnSettingsMinimal, conversionCollectorPlugin } from '..'

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

  it('posts batched track and identify to the collector without calling Segment.io', async () => {
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
        plugins: [collector],
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

    const body = JSON.parse(String(init.body)) as {
      events: Array<{
        type: string
        event_name?: string
        anonymous_id: string
        user_id?: string
        version: number
        sent_at?: string
      }>
    }

    expect(body.events).toHaveLength(2)
    expect(body.events[0]?.type).toBe('track')
    expect(body.events[0]?.event_name).toBe('quiz_started')
    expect(body.events[1]?.type).toBe('identify')
    expect(body.events[1]?.user_id).toBe('user-1')
    expect(body.events[0]?.version).toBe(2)
    expect(typeof body.events[0]?.anonymous_id).toBe('string')
    expect(typeof body.events[0]?.sent_at).toBe('string')

    const segmentCalls = fetchMock.mock.calls.filter(([callUrl]) =>
      String(callUrl).includes('api.segment.io')
    )
    expect(segmentCalls).toHaveLength(0)
  })
})
