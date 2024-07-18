import { CDNSettingsBuilder } from '@internal/test-helpers'
import { Page, Request } from '@playwright/test'
import { logConsole } from './log-console'
import { SegmentEvent } from '@segment/analytics-next'

export class BasePage {
  protected page!: Page
  public lastSignalsApiReq!: Request
  public signalsApiReqs: SegmentEvent[] = []
  public lastTrackingApiReq!: Request
  public trackingApiReqs: SegmentEvent[] = []

  public url: string
  public edgeFnDownloadURL = 'https://cdn.edgefn.segment.com/MY-WRITEKEY/foo.js'
  public edgeFn!: string

  constructor(path: string) {
    this.url = 'http://localhost:5432/src/tests' + path
  }

  /**
   * load and setup routes
   * @param page
   * @param edgeFn - edge function to be loaded
   */
  async load(page: Page, edgeFn: string) {
    logConsole(page)
    this.page = page
    this.edgeFn = edgeFn
    await this.setupMockedRoutes()
    await this.page.goto(this.url)
    // expect analytics to be loaded
    await Promise.all([
      this.waitForCDNSettingsResponse(),
      this.waitForEdgeFunctionResponse(),
    ])
  }

  private async setupMockedRoutes() {
    // clear any existing saved requests
    this.signalsApiReqs = []
    this.trackingApiReqs = []
    this.lastSignalsApiReq = undefined as any as Request
    this.lastTrackingApiReq = undefined as any as Request

    await Promise.all([
      this.mockSignalsApi(),
      this.mockTrackingApi(),
      this.mockCDNSettings(),
    ])
  }

  async mockTrackingApi() {
    await this.page.route('https://api.segment.io/v1/*', (route, request) => {
      this.lastTrackingApiReq = request
      this.trackingApiReqs.push(request.postDataJSON())
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

  waitForTrackingApiFlush(timeout = 5000) {
    return this.page.waitForResponse('https://api.segment.io/v1/*', { timeout })
  }

  async mockSignalsApi() {
    await this.page.route(
      'https://signals.segment.io/v1/*',
      (route, request) => {
        this.lastSignalsApiReq = request
        this.signalsApiReqs.push(request.postDataJSON())
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

  waitForSignalsApiFlush(timeout = 5000) {
    return this.page.waitForResponse('https://signals.segment.io/v1/*', {
      timeout,
    })
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
