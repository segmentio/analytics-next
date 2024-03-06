import { test, expect } from '@playwright/test'
import { standaloneMock } from './helpers/standalone-mock'
import { extractWriteKeyFromUrl } from './helpers/extract-writekey'
import { CDNSettingsBuilder } from '@internal/test-helpers'

test.describe('Segment with custom global key', () => {
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
          body: JSON.stringify(new CDNSettingsBuilder({ writeKey }).build()),
        })
      }
    )
  })

  test('supports using a custom global key', async ({ page }) => {
    // Load analytics.js
    await page.goto('/standalone-custom-key.html')
    await page.evaluate(() => {
      ;(window as any).segment_analytics.track('track before load')
      ;(window as any).segment_analytics.load('fake-key')
    })

    const req = await page.waitForRequest('https://api.s.dreamdata.io/v1/t')

    // confirm that any events triggered before load have been sent
    expect(req.postDataJSON().event).toBe('track before load')

    const contextObj = await page.evaluate(() =>
      (window as any).segment_analytics.track('track after load')
    )

    // confirm that any events triggered after load return a regular context object
    expect(contextObj).toMatchObject(
      expect.objectContaining({
        attempts: expect.anything(),
        event: expect.objectContaining({ event: 'track after load' }),
        stats: expect.objectContaining({ metrics: expect.anything() }),
      })
    )
  })
})
