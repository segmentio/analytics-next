import { test, expect } from '@playwright/test'
import { assertSdkBundleExists, gotoTestLp, setupCollectMock } from './helpers'

test.beforeAll(() => {
  assertSdkBundleExists()
})

test.describe('Conversion SDK — flush on unload', () => {
  test('flushes pending events on page navigation (pagehide) via keepalive fetch', async ({
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

  test('uses real sendBeacon on pagehide when available', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'sendBeacon', {
        value: (url: string, data: BodyInit) => {
          ;(window as any).__beaconUrl = url
          ;(window as any).__beaconData = data
          return true
        },
        configurable: true,
        writable: true,
      })
    })

    await gotoTestLp(page)
    await page.click('#track-impression')

    await page.goto('/conversion-sdk/blank.html')

    const beacon = await page.evaluate(() => ({
      url: (window as any).__beaconUrl as string | null,
      data: (window as any).__beaconData as Blob | null,
    }))

    expect(beacon.url).toBe('/collector')
    expect(beacon.data).toBeTruthy()
    expect(beacon.data instanceof Blob).toBe(true)
  })

  test('flushes on visibilitychange hidden', async ({ page }) => {
    const { bodies } = await setupCollectMock(page)
    await gotoTestLp(page)

    await page.click('#track-impression')

    // Simulate tab going to background / user switching tabs
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await expect
      .poll(
        () =>
          bodies.some((b) => b?.some((e) => e.event === 'impression') ?? false),
        { timeout: 10000 }
      )
      .toBe(true)
  })
})
