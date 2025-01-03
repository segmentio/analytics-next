import { JSDOM } from 'jsdom'
import { Analytics } from '../../core/analytics'
import { AnalyticsBrowser } from '..'
import { setGlobalCDNUrl } from '../../lib/parse-cdn'
import { TEST_WRITEKEY } from '../../test-helpers/test-writekeys'
import { createMockFetchImplementation } from '../../test-helpers/fixtures/create-fetch-method'
import { parseFetchCall } from '../../test-helpers/fetch-parse'
import { cdnSettingsKitchenSink } from '../../test-helpers/fixtures/cdn-settings'

const fetchCalls: ReturnType<typeof parseFetchCall>[] = []
jest.mock('unfetch', () => {
  return {
    __esModule: true,
    default: (url: RequestInfo, body?: RequestInit) => {
      const call = parseFetchCall([url, body])
      fetchCalls.push(call)
      return createMockFetchImplementation(cdnSettingsKitchenSink)(url, body)
    },
  }
})

const writeKey = TEST_WRITEKEY

describe('queryString', () => {
  let jsd: JSDOM

  beforeEach(async () => {
    const html = `
    <!DOCTYPE html>
      <head>
        <script>'hi'</script>
      </head>
      <body>
      </body>
    </html>
    `.trim()

    jsd = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'https://localhost',
    })

    const windowSpy = jest.spyOn(global, 'window', 'get')
    windowSpy.mockImplementation(
      () => jsd.window as unknown as Window & typeof globalThis
    )
    setGlobalCDNUrl(undefined as any)
  })

  it('querystring events that update anonymousId have priority over other buffered events', async () => {
    const queryStringSpy = jest.spyOn(Analytics.prototype, 'queryString')

    jsd.reconfigure({
      url: 'https://localhost/?ajs_aid=123',
    })

    const analytics = new AnalyticsBrowser()
    const pagePromise = analytics.page()
    await analytics.load({ writeKey })
    expect(queryStringSpy).toHaveBeenCalledWith('?ajs_aid=123')
    const pageContext = await pagePromise
    expect(pageContext.event.anonymousId).toBe('123')
    const user = await analytics.user()
    expect(user.anonymousId()).toBe('123')
  })

  it('querystring events have middleware applied like any other event', async () => {
    jsd.reconfigure({
      url: 'https://localhost/?ajs_event=Clicked',
    })

    const analytics = new AnalyticsBrowser()
    void analytics.addSourceMiddleware(({ next, payload }) => {
      payload.obj.event = payload.obj.event + ' Middleware Applied'
      return next(payload)
    })
    await analytics.load({ writeKey })
    const trackCalls = fetchCalls.filter(
      (call) => call.url === 'https://api.segment.io/v1/t'
    )
    expect(trackCalls.length).toBe(1)
    expect(trackCalls[0].body.event).toMatchInlineSnapshot(
      `"Clicked Middleware Applied"`
    )
  })

  it('applies query string logic if window.location.search is present', async () => {
    const mockQueryString = jest
      .spyOn(Analytics.prototype, 'queryString')
      .mockImplementation(() => Promise.resolve([]))

    jsd.reconfigure({
      url: 'https://localhost/?ajs_id=123',
    })

    await AnalyticsBrowser.load({ writeKey })
    expect(mockQueryString).toHaveBeenCalledWith('?ajs_id=123')
  })

  it('applies query string logic if window.location.hash is present', async () => {
    const mockQueryString = jest
      .spyOn(Analytics.prototype, 'queryString')
      .mockImplementation(() => Promise.resolve([]))

    jsd.reconfigure({
      url: 'https://localhost/#/?ajs_id=123',
    })

    await AnalyticsBrowser.load({ writeKey })
    expect(mockQueryString).toHaveBeenCalledWith('?ajs_id=123')

    jsd.reconfigure({
      url: 'https://localhost/#about?ajs_id=123',
    })

    await AnalyticsBrowser.load({ writeKey })
    expect(mockQueryString).toHaveBeenCalledWith('?ajs_id=123')
  })

  it('applies query string logic if window.location.hash is present in different formats', async () => {
    jest.mock('../../core/analytics')
    const mockQueryString = jest
      .fn()
      .mockImplementation(() => Promise.resolve())
    Analytics.prototype.queryString = mockQueryString

    jsd.reconfigure({
      url: 'https://localhost/#about?ajs_id=123',
    })

    await AnalyticsBrowser.load({ writeKey })
    expect(mockQueryString).toHaveBeenCalledWith('?ajs_id=123')
  })
})
