import { test, expect } from '@playwright/test'
import { SettingsBuilder } from './fixtures/settings'
import { standaloneMock } from './helpers/standalone-mock'

test.describe('Standalone tests', () => {
  test.beforeEach(standaloneMock)

  test.describe('Segment.io Retries', () => {
    test.beforeEach(async ({ context }) => {
      await context.route(
        'https://cdn.segment.com/v1/projects/*/settings',
        (route, request) => {
          if (request.method().toLowerCase() !== 'get') {
            return route.continue()
          }

          return route.fulfill({
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(new SettingsBuilder().build()),
          })
        }
      )
    })

    test.skip('supports retries on page navigation', async ({ page }) => {
      // Load analytics.js
      await page.goto('/standalone.html')
      await page.evaluate(() => window.analytics.load('fake-key'))

      // fail the 1st request
      await page.route(
        'https://api.segment.io/v1/t',
        (route) => {
          return route.abort('blockedbyclient')
        },
        {
          times: 1,
        }
      )
      const requestFailure = new Promise((resolve) => {
        page.once('requestfailed', resolve)
      })

      // trigger an event
      await page.evaluate(() => {
        void window.analytics.track('test event')
      })

      await requestFailure
      await page.reload()

      // load analytics.js again and wait for a new request.
      const [request] = await Promise.all([
        page.waitForRequest('https://api.segment.io/v1/t'),
        page.evaluate(() => window.analytics.load('fake-key')),
      ])

      expect(request.method()).toBe('GET')
    })
  })
})
