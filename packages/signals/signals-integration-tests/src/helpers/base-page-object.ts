import { CDNSettingsBuilder } from '@internal/test-helpers'
import { Page, Request, Route } from '@playwright/test'
import { logConsole } from './log-console'
import { SegmentEvent } from '@segment/analytics-next'
import { Signal, SignalsPluginSettingsConfig } from '@segment/analytics-signals'

type FulfillOptions = Parameters<Route['fulfill']>['0']

export class BasePage {
  protected page!: Page
  static defaultTestApiURL = 'http://localhost:5432/api/foo'
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

  public origin() {
    return new URL(this.page.url()).origin
  }

  /**
   * Load and setup routes
   * and wait for analytics and signals to be initialized
   */
  async loadAndWait(...args: Parameters<BasePage['load']>) {
    await this.load(...args)
    await this.waitForSignalsAssets()
    return this
  }

  /**
   * load and setup routes
   */
  async load(
    page: Page,
    edgeFn: string,
    signalSettings: Partial<SignalsPluginSettingsConfig> = {}
  ) {
    logConsole(page)
    this.page = page
    this.edgeFn = edgeFn
    await this.setupMockedRoutes()
    await this.page.goto(this.url)
    await this.invokeAnalyticsLoad(signalSettings)
  }

  /**
   * Wait for analytics and signals to be initialized
   */
  async waitForSignalsAssets() {
    // this is kind of an approximation of full initialization
    return Promise.all([
      this.waitForCDNSettingsResponse(),
      this.waitForEdgeFunctionResponse(),
    ])
  }

  /**
   * Invoke the analytics load sequence, but do not wait for analytics to full initialize
   * Full initialization means that the CDN settings and edge function have been loaded
   */
  private async invokeAnalyticsLoad(
    signalSettings: Partial<SignalsPluginSettingsConfig> = {}
  ) {
    await this.page.evaluate(
      ({ signalSettings }) => {
        window.signalsPlugin = new window.SignalsPlugin({
          disableSignalsRedaction: true,
          flushInterval: 1000,
          ...signalSettings,
        })
        window.analytics.load({
          writeKey: '<SOME_WRITE_KEY>',
          plugins: [window.signalsPlugin],
        })
      },
      { signalSettings }
    )
    return this
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

  async waitForSignalsEmit(
    filter: (signal: Signal) => boolean,
    {
      expectedSignalCount,
      maxTimeoutMs = 10000,
      failOnEmit = false,
    }: {
      expectedSignalCount?: number
      maxTimeoutMs?: number
      failOnEmit?: boolean
    } = {}
  ) {
    return this.page.evaluate(
      ([filter, expectedSignalCount, maxTimeoutMs, failOnEmit]) => {
        return new Promise((resolve, reject) => {
          let signalCount = 0
          const to = setTimeout(() => {
            if (failOnEmit) {
              resolve('No signal emitted')
            } else {
              reject('Timed out waiting for signals')
            }
          }, maxTimeoutMs)
          window.signalsPlugin.onSignal((signal) => {
            signalCount++
            if (
              eval(filter)(signal) &&
              signalCount === (expectedSignalCount ?? 1)
            ) {
              if (failOnEmit) {
                reject(
                  `Signal should not have been emitted: ${JSON.stringify(
                    signal,
                    null,
                    2
                  )}`
                )
              } else {
                resolve(signal)
              }
              clearTimeout(to)
            }
          })
        })
      },
      [
        filter.toString(),
        expectedSignalCount,
        maxTimeoutMs,
        failOnEmit,
      ] as const
    )
  }

  async mockTestRoute(
    url = BasePage.defaultTestApiURL,
    response?: Partial<FulfillOptions>
  ) {
    if (url.startsWith('/')) {
      url = new URL(url, this.page.url()).href
    }
    await this.page.route(url, (route) => {
      return route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({ someResponse: 'yep' }),
        ...response,
      })
    })
  }

  async makeFetchCall(
    url = BasePage.defaultTestApiURL,
    request?: Partial<RequestInit>
  ): Promise<void> {
    let normalizeUrl = url
    if (url.startsWith('/')) {
      normalizeUrl = new URL(url, this.page.url()).href
    }
    const req = this.page.waitForResponse(normalizeUrl ?? url)
    await this.page.evaluate(
      ({ url, request }) => {
        return fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ foo: 'bar' }),
          ...request,
        })
          .then(console.log)
          .catch(console.error)
      },
      { url, request }
    )
    await req
  }

  async makeXHRCall(
    url = BasePage.defaultTestApiURL,
    request: Partial<{
      method: string
      body: any
      contentType: string
      responseType: XMLHttpRequestResponseType
    }> = {}
  ): Promise<void> {
    let normalizeUrl = url
    if (url.startsWith('/')) {
      normalizeUrl = new URL(url, this.page.url()).href
    }
    const req = this.page.waitForResponse(normalizeUrl ?? url)
    await this.page.evaluate(
      ({ url, body, contentType, method, responseType }) => {
        const xhr = new XMLHttpRequest()
        xhr.open(method ?? 'POST', url)
        xhr.responseType = responseType ?? 'json'
        xhr.setRequestHeader('Content-Type', contentType ?? 'application/json')
        xhr.send(body || JSON.stringify({ foo: 'bar' }))
      },
      { url, ...request }
    )
    await req
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
