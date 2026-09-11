import { join as joinPath } from 'path'
import { test, expect, Page } from '@playwright/test'
import { CDNSettingsBuilder } from '@internal/test-helpers'
import { standaloneMock } from './helpers/standalone-mock'

// same fixture the other tests load via page.goto('/standalone.html'), served directly since these fake subdomains aren't behind the real http-server
const STANDALONE_HTML_PATH = joinPath(__dirname, '..', 'standalone.html')

const PARENT_DOMAIN = 'ajs-repro.test'
const SUBDOMAIN_A = `http://a.${PARENT_DOMAIN}/`
const SUBDOMAIN_B = `http://b.${PARENT_DOMAIN}/`

const getAnonymousId = () => window.analytics.user().anonymousId() as string

async function loadAnalytics(page: Page) {
  await page.evaluate(() => {
    window.analytics.load('fake-key', {
      cookie: { domain: '.ajs-repro.test' },
    })
  })
  await page.waitForFunction(() => window.analytics.initialized)
}

test.describe(
  'anonymousId sync across subdomains (segmentio/analytics-next#706)',
  () => {
    test.beforeEach(standaloneMock)

    test.beforeEach(async ({ context }) => {
      await context.route(`${SUBDOMAIN_A}**`, (route) =>
        route.fulfill({ status: 200, path: STANDALONE_HTML_PATH })
      )
      await context.route(`${SUBDOMAIN_B}**`, (route) =>
        route.fulfill({ status: 200, path: STANDALONE_HTML_PATH })
      )
      await context.route(
        'https://cdn.segment.com/v1/projects/*/settings',
        (route) =>
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(
              new CDNSettingsBuilder({ writeKey: 'fake-key' }).build()
            ),
          })
      )
      await context.route('https://api.segment.io/v1/*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{}',
        })
      )
    })

    test('subdomains converge and stay converged after diverging (segmentio/analytics-next#706)', async ({
      context,
    }) => {
      const pageA = await context.newPage()
      await pageA.goto(SUBDOMAIN_A)
      await loadAnalytics(pageA)
      const original = await pageA.evaluate(getAnonymousId)

      const pageB = await context.newPage()
      await pageB.goto(SUBDOMAIN_B)
      await loadAnalytics(pageB)
      // sanity check: B picked up the same id via the shared cookie before anything diverges
      expect(await pageB.evaluate(getAnonymousId)).toEqual(original)

      // user clears cookies + site data for subdomain A: wipes the shared cookie and A's own
      // localStorage, but B's localStorage (a different origin) is untouched.
      await context.clearCookies()
      await pageA.evaluate(() => localStorage.clear())
      await pageA.reload()
      await loadAnalytics(pageA)
      const freshId = await pageA.evaluate(getAnonymousId)
      expect(freshId).not.toEqual(original)

      // A re-agrees with the now-updated shared cookie
      await pageA.reload()
      await loadAnalytics(pageA)
      const idA = await pageA.evaluate(getAnonymousId)

      // B still has the stale pre-clear id in its own localStorage, but resolves to the cookie
      await pageB.reload()
      await loadAnalytics(pageB)
      const idB = await pageB.evaluate(getAnonymousId)

      expect(idA).toEqual(idB)

      // stays converged on further navigation, doesn't start ping-ponging again
      await pageB.reload()
      await loadAnalytics(pageB)
      expect(await pageB.evaluate(getAnonymousId)).toEqual(idA)

      await pageA.reload()
      await loadAnalytics(pageA)
      expect(await pageA.evaluate(getAnonymousId)).toEqual(idA)
    })
  }
)
