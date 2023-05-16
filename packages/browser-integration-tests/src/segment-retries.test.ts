import { Request, test, expect } from '@playwright/test'
import { SettingsBuilder } from './fixtures/settings'
import { standaloneMock } from './helpers/standalone-mock'
import { extractWriteKeyFromUrl } from './helpers/extract-writekey'
import {
  PersistedQueueResult,
  getPersistedItems,
} from './helpers/get-persisted-items'

test.describe('Standalone tests', () => {
  test.beforeEach(standaloneMock)
  test.beforeEach(async ({ context }) => {
    await context.route(
      'https://cdn.segment.com/v1/projects/*/settings',
      (route, request) => {
        if (request.method().toLowerCase() !== 'get') {
          return route.continue()
        }

        const writeKey = extractWriteKeyFromUrl(request.url()) || 'writeKey'
        return route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(new SettingsBuilder(writeKey).build()),
        })
      }
    )
  })
  test.beforeEach(async ({ context }) => {
    await context.setOffline(false)
  })

  test.describe('Segment.io Retries', () => {
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

    test('events persisted to localStorage do not leak across write keys', async ({
      page,
    }) => {
      // Load analytics.js
      await page.goto('/standalone.html')
      await page.evaluate(() => window.analytics.load('key1'))

      // fail the initial track request on first 2 page loads (2 different write keys)
      await page.route(
        'https://api.segment.io/v1/t',
        (route) => {
          return route.abort('blockedbyclient')
        },
        {
          times: 2,
        }
      )
      let requestFailure = new Promise<Record<string, any>>((resolve) => {
        page.once('requestfailed', (request) => resolve(request.postDataJSON()))
      })

      // trigger an event that wil fail
      await page.evaluate(() => {
        void window.analytics.track('test event')
      })

      const { messageId: messageId1 } = await requestFailure
      await page.reload()

      // check localstorage for event data from previous analytics (key1)
      let persistedItems = await page.evaluate(getPersistedItems)

      expect(persistedItems).toHaveLength(1)
      expect(persistedItems[0].writeKey).toBe('key1')
      expect(persistedItems[0].messageIds).toStrictEqual([messageId1])

      requestFailure = new Promise<Record<string, any>>((resolve) => {
        page.once('requestfailed', (request) => resolve(request.postDataJSON()))
      })

      // Load analytics with a different write key (key2)
      await page.evaluate(() => window.analytics.load('key2'))

      // trigger an event that will fail
      await page.evaluate(() => {
        void window.analytics.track('test event')
      })

      const { messageId: messageId2 } = await requestFailure
      await page.reload()

      // check localstorage for data from both write keys
      persistedItems = await page.evaluate(getPersistedItems)

      expect(persistedItems).toHaveLength(2)
      const persistedByWriteKey = persistedItems.reduce((prev, cur) => {
        prev[cur.writeKey || '_'] = cur
        return prev
      }, {} as { [writeKey: string]: PersistedQueueResult })
      expect(persistedByWriteKey['key1'].messageIds).toStrictEqual([messageId1])
      expect(persistedByWriteKey['key2'].messageIds).toStrictEqual([messageId2])

      // Now load analytics with original write key (key1) to validate message is sent
      const [request] = await Promise.all([
        page.waitForRequest('https://api.segment.io/v1/t'),
        page.evaluate(() => window.analytics.load('key1')),
      ])

      expect(request.method()).toBe('POST')
      expect(request.postDataJSON().messageId).toBe(messageId1)
      expect(request.postDataJSON().writeKey).toBe('key1')

      // Make sure localStorage only has data for the 2nd writeKey - which wasn't reloaded.
      persistedItems = await page.evaluate(getPersistedItems)

      expect(persistedItems).toHaveLength(1)
      expect(persistedItems[0].writeKey).toBe('key2')
      expect(persistedItems[0].messageIds).toStrictEqual([messageId2])
    })
  })
})
