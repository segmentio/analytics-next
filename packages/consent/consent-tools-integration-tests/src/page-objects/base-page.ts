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
    await waitUntilReady()
    await browser.url(baseURL + '/' + this.page)
    await this.mockCDNSettingsEndpoint()
  }

  async clearStorage() {
    await browser.deleteAllCookies()
    await browser.execute(() => localStorage.clear())
  }

  /**
   * Mock the CDN Settings endpoint so that this can run offline
   */
  private mockCDNSettingsEndpoint() {
    const createConsentSettings = (categories: string[] = []) => ({
      consentSettings: {
        categories,
      },
    })
    const settings = new CDNSettingsBuilder({ writeKey: 'something' })
      .addActionDestinationSettings({
        creationName: 'FullStory',
        ...createConsentSettings(['Analytics']),
      })
      .addActionDestinationSettings({
        creationName: 'Actions Amplitude',
        ...createConsentSettings(['Advertising']),
      })
      .build()

    browser
      .mock('https://cdn.segment.com/v1/projects/**/settings')
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
