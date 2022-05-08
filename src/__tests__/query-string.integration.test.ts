import { JSDOM } from 'jsdom'
import { Analytics } from '../analytics'
// @ts-ignore loadLegacySettings mocked dependency is accused as unused
import { AnalyticsBrowser } from '../browser'
import { TEST_WRITEKEY } from './test-writekeys'

const writeKey = TEST_WRITEKEY

describe('queryString', () => {
  let jsd: JSDOM

  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.resetAllMocks()

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
    AnalyticsBrowser._resetGlobalState()
  })

  it('applies query string logic before analytics is finished initializing', async () => {
    let analyticsInitializedBeforeQs: boolean | undefined
    const originalQueryString = Analytics.prototype.queryString
    const mockQueryString = jest
      .fn()
      .mockImplementation(async function (this: Analytics, ...args) {
        // simulate network latency when retrieving the bundle
        await new Promise((r) => setTimeout(r, 500))
        return originalQueryString.apply(this, args).then((result) => {
          // ensure analytics has not finished initializing before querystring completes
          analyticsInitializedBeforeQs = this.initialized
          return result
        })
      })
    Analytics.prototype.queryString = mockQueryString

    jsd.reconfigure({
      url: 'https://localhost/?ajs_aid=123',
    })

    const [analytics] = await AnalyticsBrowser.load({ writeKey })
    expect(mockQueryString).toHaveBeenCalledWith('?ajs_aid=123')
    expect(analyticsInitializedBeforeQs).toBe(false)
    // check that calls made immediately after analytics is loaded use correct anonymousId
    const pageContext = await analytics.page()
    expect(pageContext.event.anonymousId).toBe('123')
    expect(analytics.user().anonymousId()).toBe('123')
  })

  it('applies query string logic if window.location.search is present', async () => {
    jest.mock('../analytics')
    const mockQueryString = jest
      .fn()
      .mockImplementation(() => Promise.resolve())
    Analytics.prototype.queryString = mockQueryString

    jsd.reconfigure({
      url: 'https://localhost/?ajs_id=123',
    })

    await AnalyticsBrowser.load({ writeKey })
    expect(mockQueryString).toHaveBeenCalledWith('?ajs_id=123')
  })

  it('applies query string logic if window.location.hash is present', async () => {
    jest.mock('../analytics')
    const mockQueryString = jest
      .fn()
      .mockImplementation(() => Promise.resolve())
    Analytics.prototype.queryString = mockQueryString

    jsd.reconfigure({
      url: 'https://localhost/#/?ajs_id=123',
    })

    await AnalyticsBrowser.load({ writeKey })
    expect(mockQueryString).toHaveBeenCalledWith('?ajs_id=123')

    jsd.reconfigure({
      url: 'https://localhost/#about?ajs_id=123',
    })

    AnalyticsBrowser._resetGlobalState()
    await AnalyticsBrowser.load({ writeKey })
    expect(mockQueryString).toHaveBeenCalledWith('?ajs_id=123')
  })

  it('applies query string logic if window.location.hash is present in different formats', async () => {
    jest.mock('../analytics')
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
