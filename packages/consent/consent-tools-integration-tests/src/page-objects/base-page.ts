import { CDNSettingsBuilder } from '@internal/test-helpers'
import type { SegmentEvent } from '@segment/analytics-next'
import assert from 'assert'
import type { Matches } from 'webdriverio'

const waitUntilReady = () =>
  browser.waitUntil(
    () => browser.execute(() => document.readyState === 'complete'),
    {
      timeout: 10000,
    }
  )

export abstract class BasePage {
  constructor(protected page: string) {}

  segmentTrackingApiReqs: Matches[] = []

  async load(): Promise<void> {
    const baseURL = browser.options.baseUrl
    await this.mockCDNSettingsEndpoint()
    await this.listenForSegmentTrackCalls()
    assert(baseURL)
    await browser.url(baseURL + '/public/' + this.page)
    await waitUntilReady()
  }

  async clearStorage() {
    await browser.deleteAllCookies()
    await browser.execute(() => window.localStorage.clear())
  }

  getAllTrackingEvents(): SegmentEvent[] {
    const reqBodies = this.segmentTrackingApiReqs.map((el) =>
      JSON.parse(el.postData!)
    )
    return reqBodies
  }

  getConsentChangedEvents(): SegmentEvent[] {
    const reqBodies = this.getAllTrackingEvents()
    const consentEvents = reqBodies.filter(
      (el) => el.event === 'Segment Consent Preference'
    )
    return consentEvents
  }

  async cleanup() {
    this.segmentTrackingApiReqs = []
    await this.clearStorage()
  }

  async listenForSegmentTrackCalls(): Promise<void> {
    const mock = await browser.mock('https://api.segment.io/v1/t', {
      method: 'post',
    })
    mock.respond((mock) => {
      this.segmentTrackingApiReqs.push(mock)
      // response with status 200
      return Promise.resolve({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      })
    })
    return
  }

  /**
   * Mock the CDN Settings endpoint so that this can run offline
   */
  private async mockCDNSettingsEndpoint(): Promise<void> {
    const settings = new CDNSettingsBuilder({
      writeKey: 'something',
    })
      .addActionDestinationSettings(
        {
          creationName: 'FullStory',
          consentSettings: {
            categories: ['FooCategory2'],
          },
        },
        {
          creationName: 'Actions Amplitude',
          consentSettings: {
            categories: ['FooCategory1'],
          },
        }
      )
      .build()

    const mock = await browser.mock('**/settings')
    mock.respond(settings, {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Hard reload the page
   */
  reload() {
    return browser.execute(() => window.location.reload())
  }
}
