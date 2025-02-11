import { CDNSettingsBuilder } from '@internal/test-helpers'
import { Page } from '@playwright/test'
import { logConsole } from './log-console'
import { Signal, SignalsPluginSettingsConfig } from '@segment/analytics-signals'
import {
  PageNetworkUtils,
  SignalAPIRequestBuffer,
  TrackingAPIRequestBuffer,
} from './network-utils'

export class BasePage {
  protected page!: Page
  public signalsAPI = new SignalAPIRequestBuffer()
  public trackingAPI = new TrackingAPIRequestBuffer()
  public url: string
  public edgeFnDownloadURL = 'https://cdn.edgefn.segment.com/MY-WRITEKEY/foo.js'
  public edgeFn!: string
  public network!: PageNetworkUtils
  public defaultSignalsPluginTestSettings: Partial<SignalsPluginSettingsConfig> =
    {
      disableSignalsRedaction: true,
      enableSignalsIngestion: true,
      flushInterval: 500,
    }

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
    await Promise.all([this.load(...args), this.waitForSettings()])
    return this
  }

  /**
   * load and setup routes
   */
  async load(
    page: Page,
    edgeFn: string,
    signalSettings: Partial<SignalsPluginSettingsConfig> = {},
    options: {
      updateURL?: (url: string) => string
      sampleRate?: number
      middleware?: string
      skipSignalsPluginInit?: boolean
    } = {}
  ) {
    logConsole(page)
    this.page = page
    this.network = new PageNetworkUtils(page)
    this.edgeFn = edgeFn
    await this.setupMockedRoutes(options.sampleRate)
    const url = options.updateURL ? options.updateURL(this.url) : this.url
    await this.page.goto(url, { waitUntil: 'domcontentloaded' })
    if (!options.skipSignalsPluginInit) {
      void this.invokeAnalyticsLoad({
        flushInterval: 500,
        ...signalSettings,
      })
    }
    return this
  }

  /**
   * Wait for analytics and signals to be initialized
   * We could do the same thing with analytics.ready() and signalsPlugin.ready()
   */
  async waitForSettings() {
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
      ({ settings }) => {
        window.signalsPlugin = new window.SignalsPlugin(settings)
        window.analytics.load({
          writeKey: '<SOME_WRITE_KEY>',
          plugins: [window.signalsPlugin],
        })
      },
      {
        settings: {
          ...this.defaultSignalsPluginTestSettings,
          ...signalSettings,
        },
      }
    )
    return this
  }

  private async setupMockedRoutes(sampleRate?: number) {
    // clear any existing saved requests
    this.trackingAPI.clear()
    this.signalsAPI.clear()

    await Promise.all([
      this.mockSignalsApi(),
      this.mockTrackingApi(),
      this.mockCDNSettings(sampleRate),
    ])
  }

  async mockTrackingApi() {
    await this.page.route('https://api.segment.io/v1/*', (route, request) => {
      if (request.method().toLowerCase() !== 'post') {
        throw new Error(`Unexpected method: ${request.method()}`)
      }
      this.trackingAPI.addRequest(request)
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
        if (request.method().toLowerCase() !== 'post') {
          throw new Error(`Unexpected method: ${request.method()}`)
        }
        this.signalsAPI.addRequest(request)
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

  waitForSignalsApiFlush(timeout = 5000) {
    return this.page.waitForResponse('https://signals.segment.io/v1/*', {
      timeout,
    })
  }

  async mockCDNSettings(sampleRate?: number) {
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
            autoInstrumentationSettings: {
              sampleRate: sampleRate ?? 1,
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

  waitForEdgeFunctionResponse(timeout = 30000) {
    return this.page.waitForResponse(this.edgeFnDownloadURL, {
      timeout,
    })
  }

  async waitForCDNSettingsResponse(timeout = 30000) {
    return this.page.waitForResponse(
      'https://cdn.segment.com/v1/projects/*/settings',
      { timeout }
    )
  }
}
