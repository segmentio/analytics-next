import { Browser } from 'playwright'
import { JSONValue } from '../../src/core/events'

type ComparisonParams = {
  browser: Browser
  serverURL: string
  writeKey: string
  script: string
}

export async function run(params: ComparisonParams) {
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
        route.fulfill({ body: 'ok!' })
      }

      let data: JSONValue
      try {
        data = JSON.parse(request.postData() ?? '{}')
      } catch (e) {
        data = null
      }

      const call = { url: request.url(), data }

      // do not Record GA calls because it thinks ajs-next is a bot and doesn't naturally trigger requests
      // we know GA works :)
      if (
        call.url.includes('doubleclick.net') ||
        (request.method() === 'POST' && data === null)
      ) {
        return
      }
      networkRequests.push(call)
    })

    const url =
      params.serverURL +
      (isNext ? '?type=next' : '?type=classic') +
      '&wk=' +
      source

    await page.goto(url)

    // This forces every timestamp to look exactly the same
    await page.evaluate('Date.prototype.toJSON = () => "<date>";')
    await page.evaluate('Date.prototype.getTime = () => 1614653469;')

    await page.waitForFunction(`window.analytics.initialized === true`)

    const codeEvaluation = await page.evaluate(execution)

    const cookies = await context.cookies()
    const localStorage: Record<string, string | null> = await page.evaluate(
      () => {
        return Object.keys(localStorage).reduce(function (obj, str) {
          obj[str] = window.localStorage.getItem(str)
          return obj
        }, {} as Record<string, string | null>)
      }
    )

    await page.waitForLoadState('networkidle')
    await page.close({ runBeforeUnload: true })

    return { networkRequests, cookies, localStorage, codeEvaluation }
  }

  const [classic, next] = await Promise.all([
    load(params.browser, false, params.writeKey, params.script),
    load(params.browser, true, params.writeKey, params.script),
  ])

  return {
    next,
    classic,
  }
}
