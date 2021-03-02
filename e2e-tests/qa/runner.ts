import playwright, { Browser } from 'playwright'
import { JSONValue } from '../../src/core/events'

export async function run(
  serverURL: string,
  source: string,
  execution: string
) {
  async function load(
    browser: Browser,
    isNext: boolean,
    source: string,
    execution: string
  ) {
    const networkRequests: Array<{ url: string; data: JSONValue }> = []
    const context = await browser.newContext()
    const page = await context.newPage()

    page.route('**', (route) => {
      const request = route.request()

      if (
        request.url().includes('cdn.segment') ||
        request.url().includes('cdn-settings') ||
        request.url().includes('localhost') ||
        request.url().includes('unpkg')
      ) {
        route.continue()
        return
      }

      if (request.resourceType() === 'script') {
        route.continue()
      } else {
        // do not actually send data
        route.fulfill({
          body: 'ok!',
        })
      }

      const data = JSON.parse(request.postData() ?? '{}')

      const call = {
        url: request.url(),
        data,
      }

      networkRequests.push(call)
    })

    const url =
      serverURL + (isNext ? '?type=next' : '?type=classic') + '&wk=' + source

    await page.goto(url, {
      waitUntil: 'networkidle',
    })

    // This forces every timestamp to look exactly the same
    await page.evaluate('Date.prototype.toJSON = () => "<date>";')
    await page.evaluate('Date.prototype.getTime = () => 1614653469;')

    await page.waitForFunction(`window.analytics.initialized === true`)
    await page.evaluate(execution)

    const cookies = await context.cookies()

    const localStorage: Record<string, string | null> = await page.evaluate(
      () => {
        return Object.keys(localStorage).reduce(function (obj, str) {
          obj[str] = window.localStorage.getItem(str)
          return obj
        }, {} as Record<string, string | null>)
      }
    )

    await page.close({
      runBeforeUnload: true,
    })

    return { networkRequests, cookies, localStorage }
  }

  const browser = await playwright.chromium.launch({})

  const [classic, next] = await Promise.all([
    load(browser, false, source, execution),
    load(browser, true, source, execution),
  ])

  await browser.close()

  return {
    next,
    classic,
  }
}
