import { CDNSettingsBuilder } from '@internal/test-helpers'
import assert from 'assert'

const waitUntilReady = () =>
  browser.waitUntil(
    () => browser.execute(() => document.readyState === 'complete'),
    {
      timeout: 10000,
    }
  )

export abstract class BasePage {
  constructor(protected page: string) {}

  async load(): Promise<void> {
    const baseURL = browser.options.baseUrl
    assert(baseURL)
    await this.mockCDNSettingsEndpoint()
    await waitUntilReady()
    await browser.url(baseURL + '/' + this.page)
  }

  async clearStorage() {
    await browser.deleteAllCookies()
    await browser.execute(() => localStorage.clear())
  }

  /**
   * Mock the CDN Settings endpoint so that this can run offline
   */
  private mockCDNSettingsEndpoint(): Promise<void> {
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

    return browser
      .mock('**/settings')
      .then((mock) =>
        mock.respond(settings, {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
      .catch(console.error)
  }

  /**
   * Hard reload the page
   */
  reload() {
    return browser.execute(() => window.location.reload())
  }
}
