import { CDNSettingsBuilder } from '@internal/test-helpers'
import { Page, Route, Request } from '@playwright/test'

export abstract class BasePage {
  protected page: Page
  protected pageFile: string

  segmentTrackingApiReqs: any[] = []
  fetchIntegrationReqs: any[] = []

  constructor(page: Page, pageFile: string) {
    this.page = page
    this.pageFile = pageFile
  }

  async load(): Promise<void> {
    await this.mockAPIs()
    await this.page.goto(`/${this.pageFile}`)
    await this.page.waitForLoadState('load')
  }

  async clearStorage() {
    await this.page.context().clearCookies()
    await this.page.evaluate(() => {
      window.localStorage.clear()
      window.sessionStorage.clear()
    })
  }

  async cleanup() {
    this.segmentTrackingApiReqs = []
    this.fetchIntegrationReqs = []
    await this.clearStorage()
  }

  getAllTrackingEvents(): any[] {
    return this.segmentTrackingApiReqs
  }

  getConsentChangedEvents(): any[] {
    return this.getAllTrackingEvents().filter(
      (el) => el.event === 'Segment Consent Preference Updated'
    )
  }

  get fetchIntegrationReqsData(): any[] {
    return this.fetchIntegrationReqs
  }

  private async mockAPIs() {
    await this.mockSegmentTrackingAPI()
    await this.mockCDNSettingsAPI()
    await this.mockNextIntegrationsAPI()
  }

  private async mockSegmentTrackingAPI() {
    await this.page.route(
      'https://api.segment.io/v1/t',
      async (route: Route, request: Request) => {
        const postData = await request.postData()
        const parsed = JSON.parse(postData || '{}')
        this.segmentTrackingApiReqs.push(parsed) // store the parsed event object directly

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      }
    )
  }

  private async mockNextIntegrationsAPI() {
    await this.page.route(
      '**/next-integrations/**',
      async (route: Route, request: Request) => {
        this.fetchIntegrationReqs.push({ url: request.url() })
        await route.fulfill({
          status: 200,
          body: 'console.log("mocking action and classic destinations")',
          contentType: 'application/javascript',
        })
      }
    )
  }

  private async mockCDNSettingsAPI(): Promise<void> {
    const cdnSettings = new CDNSettingsBuilder({
      writeKey: 'foo',
    })
      .addActionDestinationSettings(
        {
          creationName: 'FullStory',
          url: 'https://cdn.segment.com/next-integrations/actions/fullstory-plugins/foo.js',
          consentSettings: {
            categories: ['FooCategory2'],
          },
        },
        {
          creationName: 'Actions Amplitude',
          url: 'https://cdn.segment.com/next-integrations/actions/amplitude-plugins/foo.js',
          consentSettings: {
            categories: ['FooCategory1'],
          },
        }
      )
      .build()

    await this.page.route('**/settings', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cdnSettings),
      })
    })
  }

  async reload() {
    await this.page.reload()
  }
}
