import { Request, test, expect } from '@playwright/test'
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

    test('supports retrying failed requests on page navigation', async ({
      page,
    }) => {
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
      const requestFailure = new Promise<Record<string, any>>((resolve) => {
        page.once('requestfailed', (request) => resolve(request.postDataJSON()))
      })

      // trigger an event
      await page.evaluate(() => {
        void window.analytics.track('test event')
      })

      const { messageId } = await requestFailure
      await page.reload()

      // load analytics.js again and wait for a new request.
      const [request] = await Promise.all([
        page.waitForRequest('https://api.segment.io/v1/t'),
        page.evaluate(() => window.analytics.load('fake-key')),
      ])

      expect(request.method()).toBe('POST')
      expect(request.postDataJSON().messageId).toBe(messageId)
    })

    test('supports retrying in-flight requests on page navigation', async ({
      page,
    }) => {
      // Load analytics.js
      await page.goto('/standalone.html')
      await page.evaluate(() => window.analytics.load('fake-key'))

      // blackhole the request so that it stays in-flight when we reload the page
      await page.route(
        'https://api.segment.io/v1/t',
        async () => {
          // do nothing
        },
        {
          times: 1,
        }
      )

      // Detect when we've seen a track request initiated by the browser
      const requestSent = new Promise<Record<string, any>>((resolve) => {
        const onRequest: (req: Request) => void = (req) => {
          if (req.url() === 'https://api.segment.io/v1/t') {
            page.off('request', onRequest)
            resolve(req.postDataJSON())
          }
        }

        page.on('request', onRequest)
      })

      // trigger an event
      await page.evaluate(() => {
        void window.analytics.track('test event')
      })

      const { messageId } = await requestSent
      await page.reload()

      // load analytics.js again and wait for a new request.
      const [request] = await Promise.all([
        page.waitForRequest('https://api.segment.io/v1/t'),
        page.evaluate(() => window.analytics.load('fake-key')),
      ])

      expect(request.method()).toBe('POST')
      expect(request.postDataJSON().messageId).toBe(messageId)
    })
  })
})
