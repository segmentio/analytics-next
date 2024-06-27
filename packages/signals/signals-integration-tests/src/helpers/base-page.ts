import { CDNSettingsBuilder } from '@internal/test-helpers'
import { Page, Request } from '@playwright/test'

export class BasePage {
  private page!: Page
  public signalReq!: Request
  public analyticsReq!: Request
  public url: string
  public edgeFnDownloadURL = 'https://cdn.edgefn.segment.com/MY-WRITEKEY/foo.js'
  public edgeFn = `
    // this is a process signal function
    const processSignal = (signal) => {
      if (signal.type === 'interaction') {
        const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
        analytics.track(eventName, signal.data)
      }
  }`

  constructor(url: string) {
    this.url = url
  }

  /**
   * load and setup routes
   */
  async load(page: Page) {
    this.page = page
    await this.setupMockedRoutes()
    await this.page.goto(this.url)
  }

  private async setupMockedRoutes() {
    await Promise.all([
      this.mockSignalRequests(),
      this.mockCDNSegmentSettings(),
      await this.mockAnalyticsRequests(),
    ])
  }

  async mockAnalyticsRequests() {
    await this.page.route('https://api.segment.io/v1/*', (route, request) => {
      this.analyticsReq = request
      if (request.method().toLowerCase() !== 'post') {
        throw new Error(`Unexpected method: ${request.method()}`)
      }
      return route.fulfill({
        contentType: 'application/json',
        status: 201,
        body: JSON.stringify({
          success: true,
        }),
      })
    })
  }

  async mockSignalRequests() {
    await this.page.route(
      'https://signals.segment.io/v1/*',
      (route, request) => {
        this.signalReq = request
        if (request.method().toLowerCase() !== 'post') {
          throw new Error(`Unexpected method: ${request.method()}`)
        }
        return route.fulfill({
          contentType: 'application/json',
          status: 201,
          body: JSON.stringify({
            success: true,
          }),
        })
      }
    )
  }

  async mockCDNSegmentSettings() {
    await this.page.route(
      'https://cdn.segment.com/v1/projects/*/settings',
      (route, request) => {
        if (request.method().toLowerCase() !== 'get') {
          throw new Error('expect to be a GET request')
        }

        const cdnSettings = new CDNSettingsBuilder({
          writeKey: '<SOME_WRITE_KEY>',
          baseCDNSettings: {
            edgeFunction: {
              downloadURL: this.edgeFnDownloadURL,
              version: 1,
            },
          },
        }).build()

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cdnSettings),
        })
      }
    )

    await this.page.route(this.edgeFnDownloadURL, (route, request) => {
      if (request.method().toLowerCase() !== 'get') {
        throw new Error('expect to be a GET request')
      }

      // Mock response for the edge function download URL
      // This can be customized based on the test requirements
      return route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: this.edgeFn,
      })
    })
  }

  // Additional mock methods can be added here
}
