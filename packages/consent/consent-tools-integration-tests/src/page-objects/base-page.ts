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
  }
}
