import { test, expect } from '@playwright/test'
import { assertSdkBundleExists, gotoTestLp, parseCollectBody } from './helpers'

test.beforeAll(() => {
  assertSdkBundleExists()
})

test.describe('Conversion SDK — offline resilience', () => {
  test('retries and delivers after collector recovers', async ({ page }) => {
    let failCollect = true
    const bodies: ReturnType<typeof parseCollectBody>[] = []

    await page.route('**/collect', async (route) => {
      const request = route.request()
      if (request.method() !== 'POST') {
        return route.continue()
      }

      if (failCollect) {
        return route.fulfill({ status: 503, body: 'unavailable' })
      }

      const body = parseCollectBody(request.postData())
      if (body) {
        bodies.push(body)
      }
      return route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, queued: body?.length ?? 0 }),
      })
    })

    await gotoTestLp(page)
    await page.click('#track-impression')

    await page.waitForTimeout(2000)

    failCollect = false

    await expect
      .poll(
        () =>
          bodies.some((b) => b?.some((e) => e.event === 'impression') ?? false),
        { timeout: 20000 }
      )
      .toBe(true)
  })
})
