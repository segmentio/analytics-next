import { CDNSettingsBuilder } from '@internal/test-helpers'
import { Page, Request } from '@playwright/test'

export class BasePage {
  protected page!: Page
  public signalsApiReq!: Request
  public trackingApiReq!: Request
  public url: string
  public edgeFnDownloadURL = 'https://cdn.edgefn.segment.com/MY-WRITEKEY/foo.js'
  public edgeFn: string

  constructor(url: string, edgeFn: string) {
    this.edgeFn = edgeFn
    this.url = url
  }

  /**
   * load and setup routes
   */
  async load(page: Page) {
    this.page = page
    await this.setupMockedRoutes()
    await this.page.goto(this.url)
    // expect analytics to be loaded
    await Promise.all([
      this.waitForCDNSettingsResponse(),
      this.waitForEdgeFunctionResponse(),
    ])
  }

  private async setupMockedRoutes() {
    await Promise.all([
      this.mockSignalsApi(),
      this.mockCDNSettings(),
      await this.mockTrackingApi(),
    ])
  }

  async mockTrackingApi() {
    await this.page.route('https://api.segment.io/v1/*', (route, request) => {
      this.trackingApiReq = request
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

  waitForTrackingApiFlush() {
    return this.page.waitForResponse('https://api.segment.io/v1/*')
  }

  async mockSignalsApi() {
    await this.page.route(
      'https://signals.segment.io/v1/*',
      (route, request) => {
        this.signalsApiReq = request
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

  waitForSignalsApiFlush() {
    return this.page.waitForResponse('https://signals.segment.io/v1/*')
  }

  async mockCDNSettings() {
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

  waitForEdgeFunctionResponse() {
    return this.page.waitForResponse(
      `https://cdn.edgefn.segment.com/MY-WRITEKEY/**`
    )
  }

  waitForCDNSettingsResponse() {
    return this.page.waitForResponse(
      'https://cdn.segment.com/v1/projects/*/settings'
    )
  }

  // Additional mock methods can be added here
}