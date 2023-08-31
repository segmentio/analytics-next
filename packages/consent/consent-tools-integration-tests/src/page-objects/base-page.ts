import assert from 'assert'

const waitUntilReady = () =>
  browser.waitUntil(
    () => browser.execute(() => document.readyState === 'complete'),
    {
      timeout: 10000,
    }
  )

interface LoadOptions {
  /**
   * Do not clear storage after loading the page
   */
  preserveStorage?: boolean
}

export abstract class BasePage {
  constructor(protected page: string) {}

  async load({ preserveStorage = false }: LoadOptions = {}): Promise<void> {
    const baseURL = browser.options.baseUrl
    assert(baseURL)
    await waitUntilReady()
    await browser.url(baseURL + '/' + this.page)
    preserveStorage && (await this.clearStorage())
  }

  async clearStorage() {
    await browser.deleteAllCookies()
    await browser.execute(() => localStorage.clear())
  }

  /**
   * Hard reload the page
   */
  reload() {
    return browser.execute(() => window.location.reload())
  }
}
