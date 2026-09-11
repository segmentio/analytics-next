import { test, expect, Page } from '@playwright/test'
import { CDNSettingsBuilder } from '@internal/test-helpers'
import { standaloneMock } from './helpers/standalone-mock'

// Same minimal AJS 1.0-style loader snippet as ./standalone.html, inlined so it can be served
// from two different (mocked) same-site origins without needing new static fixture files.
const SNIPPET_HTML = `<!DOCTYPE html>
<html>
  <head>
    <script>
      !(function () {
        var analytics = (window.analytics = window.analytics || [])
        if (!analytics.initialize) {
          if (analytics.invoked) {
            window.console && console.error && console.error('Segment snippet included twice.')
          } else {
            analytics.invoked = !0
            analytics.methods = ['trackSubmit','trackClick','trackLink','trackForm','pageview','identify','reset','group','track','ready','alias','debug','page','once','off','on','addSourceMiddleware','addIntegrationMiddleware','setAnonymousId','addDestinationMiddleware']
            analytics.factory = function (e) {
              return function () {
                var t = Array.prototype.slice.call(arguments)
                t.unshift(e)
                analytics.push(t)
                return analytics
              }
            }
            for (var e = 0; e < analytics.methods.length; e++) {
              var key = analytics.methods[e]
              analytics[key] = analytics.factory(key)
            }
            analytics.load = function (key, e) {
              var t = document.createElement('script')
              t.type = 'text/javascript'
              t.async = !0
              t.src = 'https://cdn.segment.com/analytics.js/v1/' + key + '/analytics.min.js'
              var n = document.getElementsByTagName('script')[0]
              n.parentNode.insertBefore(t, n)
              analytics._loadOptions = e
              analytics._writeKey = key
            }
            analytics.SNIPPET_VERSION = '4.15.3'
          }
        }
      })()
    </script>
  </head>
  <body></body>
</html>`

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
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: SNIPPET_HTML,
        })
      )
      await context.route(`${SUBDOMAIN_B}**`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: SNIPPET_HTML,
        })
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
