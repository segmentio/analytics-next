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

async function loadAnalytics(page: Page, resolveAnonymousIdConflicts: boolean) {
  await page.evaluate((resolveAnonymousIdConflicts) => {
    window.analytics.load('fake-key', {
      cookie: { domain: '.ajs-repro.test' },
      user: { resolveAnonymousIdConflicts },
    })
  }, resolveAnonymousIdConflicts)
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

    // reproduces the #706 sequence: a user clears cookies + site data on subdomain A only,
    // leaving subdomain B's localStorage stale -- the two subdomains disagree from then on.
    async function reproduceDivergence(
      context: import('@playwright/test').BrowserContext,
      resolveAnonymousIdConflicts: boolean
    ) {
      const pageA = await context.newPage()
      await pageA.goto(SUBDOMAIN_A)
      await loadAnalytics(pageA, resolveAnonymousIdConflicts)
      const original = await pageA.evaluate(getAnonymousId)

      const pageB = await context.newPage()
      await pageB.goto(SUBDOMAIN_B)
      await loadAnalytics(pageB, resolveAnonymousIdConflicts)
      // sanity check: B picked up the same id via the shared cookie before anything diverges
      expect(await pageB.evaluate(getAnonymousId)).toEqual(original)

      // user clears cookies + site data for subdomain A: wipes the shared cookie and A's own
      // localStorage, but B's localStorage (a different origin) is untouched.
      await context.clearCookies()
      await pageA.evaluate(() => localStorage.clear())
      await pageA.reload()
      await loadAnalytics(pageA, resolveAnonymousIdConflicts)
      const freshId = await pageA.evaluate(getAnonymousId)
      expect(freshId).not.toEqual(original)

      // B still has the stale pre-clear id in its own localStorage
      await pageB.reload()
      await loadAnalytics(pageB, resolveAnonymousIdConflicts)
      const idB = await pageB.evaluate(getAnonymousId)

      // back to A again, after B's read above may have overwritten the shared cookie
      await pageA.reload()
      await loadAnalytics(pageA, resolveAnonymousIdConflicts)
      const idA = await pageA.evaluate(getAnonymousId)

      return { pageA, pageB, idA, idB, freshId, original }
    }

    test('without resolveAnonymousIdConflicts (default): subdomains stay diverged', async ({
      context,
    }) => {
      const { idA, idB } = await reproduceDivergence(context, false)
      expect(idA).not.toEqual(idB)
    })

    test('with resolveAnonymousIdConflicts: subdomains converge and stay converged', async ({
      context,
    }) => {
      const { pageA, pageB, idA, idB } = await reproduceDivergence(
        context,
        true
      )
      expect(idA).toEqual(idB)

      // stays converged on further navigation, doesn't start ping-ponging again
      await pageB.reload()
      await loadAnalytics(pageB, true)
      expect(await pageB.evaluate(getAnonymousId)).toEqual(idA)

      await pageA.reload()
      await loadAnalytics(pageA, true)
      expect(await pageA.evaluate(getAnonymousId)).toEqual(idA)
    })
  }
)
