import { test, expect } from '@playwright/test'
import {
  assertSdkBundleExists,
  expectNormalizeReadyEvent,
  findEvent,
  gotoTestLp,
  setupCollectMock,
} from './helpers'

test.beforeAll(() => {
  assertSdkBundleExists()
})

test.describe('Conversion SDK — landing page', () => {
  test('initializes window.analytics with writeKey and delivers page event', async ({
    page,
  }) => {
    const { bodies } = await setupCollectMock(page)
    await gotoTestLp(page)

    await expect
      .poll(() => bodies.length, { timeout: 10000 })
      .toBeGreaterThan(0)

    const api = await page.evaluate(() => {
      const w = window as unknown as {
        analytics?: {
          loaded?: boolean
          _sessionId?: string
        }
      }
      return {
        loaded: w.analytics?.loaded === true,
        sessionId: w.analytics?._sessionId,
      }
    })

    expect(api.loaded).toBe(true)
    expect(typeof api.sessionId).toBe('string')

    expectNormalizeReadyEvent(bodies[0]!, 'page')
    const pageEvent = findEvent(bodies[0]!, 'page')
    const app = pageEvent?.context?.app as { name?: string } | undefined
    expect(app?.name).toBe('e2e-lp')
    const campaign = pageEvent?.context?.campaign as
      | { source?: string; name?: string }
      | undefined
    expect(campaign?.source).toBe('e2e')
    expect(campaign?.name).toBe('test')
    expect(pageEvent?.properties?.block_id).toBeUndefined()
  })

  test('track impression includes ad-tech properties', async ({ page }) => {
    const { bodies } = await setupCollectMock(page)
    await gotoTestLp(page)

    await page.click('#track-impression')

    await expect
      .poll(() => bodies.some((b) => b.some((e) => e.event === 'impression')), {
        timeout: 12000,
      })
      .toBe(true)

    const impressionBatch = bodies.find((b) =>
      b.some((e) => e.event === 'impression')
    )
    const impression = impressionBatch?.find((e) => e.event === 'impression')
    expect(impression?.properties?.block_id).toBe('top_father')
    expect(impression?.properties?.block_position).toBe(1)
    expect(typeof impression?.context.sessionId).toBe('string')
  })
})
