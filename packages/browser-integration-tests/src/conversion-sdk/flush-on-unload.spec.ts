import { test, expect } from '@playwright/test'
import { assertSdkBundleExists, gotoTestLp, setupCollectMock } from './helpers'

test.beforeAll(() => {
  assertSdkBundleExists()
})

test.describe('Conversion SDK — flush on unload', () => {
  test('flushes pending events on page navigation (pagehide)', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      navigator.sendBeacon = () => false
    })

    const { bodies } = await setupCollectMock(page)
    await gotoTestLp(page)

    const batchesBefore = bodies.length

    await page.click('#track-impression')
    await page.goto('/conversion-sdk/blank.html')

    await expect
      .poll(() => bodies.length, { timeout: 10000 })
      .toBeGreaterThan(batchesBefore)

    const newBatches = bodies.slice(batchesBefore)
    const impression = newBatches
      .flatMap((b) => b)
      .find((e) => e.event === 'impression')

    expect(impression).toBeDefined()
    expect(impression?.properties?.block_id).toBe('top_father')
    expect(typeof impression?.context.sessionId).toBe('string')
  })
})
