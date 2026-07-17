import { Analytics } from '../core/analytics'
import { SerializedContext } from '../core/context'
import mem from 'micro-memoize'
import playwright from 'playwright'
import { join as joinPath } from 'path'

type BrowserType = 'chromium' | 'firefox' | 'webkit'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function makeStub(page: playwright.Page) {
  const stub = {
    async register(
      ...args: Parameters<Analytics['register']>
    ): Promise<SerializedContext> {
      return await page.evaluate((innerArgs) => {
        return (
          // @ts-ignore
          window.analytics
            .register(...innerArgs)
            // @ts-ignore
            .then((ctx) => ctx.toJSON())
        )
      }, args)
    },
    async track(
      ...args: Parameters<Analytics['track']>
    ): Promise<SerializedContext> {
      const ctx = await page.evaluate((innerArgs) => {
        // @ts-ignore
        return window.analytics.track(...innerArgs).then((ctx) => {
          return ctx.toJSON()
        })
        // @ts-ignore
      }, args)

      return ctx
    },
    async page(
      ...args: Parameters<Analytics['page']>
    ): Promise<SerializedContext> {
      const ctx = await page.evaluate((innerArgs) => {
        // @ts-ignore
        return window.analytics.page(...innerArgs).then((ctx) => {
          return ctx.toJSON()
        })
        // @ts-ignore
      }, args)

      return ctx
    },

    async identify(
      ...args: Parameters<Analytics['identify']>
    ): Promise<SerializedContext> {
      const ctx = await page.evaluate((innerArgs) => {
        // @ts-ignore
        return window.analytics.identify(...innerArgs).then((ctx) => {
          return ctx.toJSON()
        })
        // @ts-ignore
      }, args)

      return ctx
    },

    browserPage: page,
  }

  return stub
}

export const getBrowser = mem(
  async (browserType?: BrowserType, remoteDebug?: boolean) => {
    const browser = await playwright[browserType ?? 'chromium'].launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        remoteDebug ? '--remote-debugging-port=9222' : '',
      ],
    })

    process.on('unhandledRejection', () => {
      browser && browser.close()
    })

    return browser
  }
)

export async function testerTeardown(): Promise<void> {
  const browser = await getBrowser()
  await browser.close()
}

export async function tester(
  _writeKey: string,
  url?: string,
  browserType?: BrowserType,
  remoteDebug?: boolean
): Promise<ReturnType<typeof makeStub>> {
  const browser = await getBrowser(browserType, remoteDebug)
  const page = await browser.newPage()

  // The built bundle's runtime CDN resolution (getCDN()) falls back to the
  // real production CDN for any chunk it lazy-loads (e.g. tsub-middleware),
  // regardless of where the main script itself was served from. Left
  // unmocked, this test would depend on whatever's currently live in
  // production matching this local build's exact chunk hash - true right
  // after a release, false the moment anything changes the build output
  // (a source change, or even just a bundler version bump). Serve those
  // requests from the local dist instead, matching the same pattern used
  // in browser-integration-tests/src/helpers/standalone-mock.ts.
  await page.route(
    'https://cdn.segment.com/analytics-next/bundles/*',
    (route, request) => {
      if (request.method().toLowerCase() !== 'get') {
        return route.continue()
      }
      const filename = request.url().split('/').pop()!
      return route.fulfill({
        path: joinPath(process.cwd(), 'dist', 'umd', filename),
      })
    }
  )

  await page.goto(
    url || `file://${process.cwd()}/src/tester/__fixtures__/index.html`
  )
  await page.evaluate(`
    window.AnalyticsNext.AnalyticsBrowser.load({
      writeKey: '${_writeKey}',
    }).then(loaded => {
      window.analytics = loaded[0]
    })
  `)

  await page.waitForFunction('window.analytics !== undefined')
  return makeStub(page)
}
