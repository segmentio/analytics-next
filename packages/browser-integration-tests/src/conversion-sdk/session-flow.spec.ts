import { test, expect } from '@playwright/test'
import { assertSdkBundleExists, gotoTestLp, setupCollectMock } from './helpers'

test.beforeAll(() => {
  assertSdkBundleExists()
})

test.describe('Conversion SDK — session flow', () => {
  test('reuses sessionId within activity window', async ({ page }) => {
    const { bodies } = await setupCollectMock(page)
    await gotoTestLp(page)

    await expect
      .poll(() => bodies.length, { timeout: 10000 })
      .toBeGreaterThan(0)

    await page.click('#track-impression')

    await expect
      .poll(() => bodies.some((b) => b.some((e) => e.event === 'impression')), {
        timeout: 12000,
      })
      .toBe(true)

    const sessionIds = bodies
      .flatMap((b) => b)
      .map((e) => e.context.sessionId)
      .filter(Boolean)

    expect(sessionIds.length).toBeGreaterThanOrEqual(2)
    expect(new Set(sessionIds).size).toBe(1)

    const readOnlySession = await page.evaluate(() => {
      const w = window as unknown as { analytics?: { _sessionId?: string } }
      return w.analytics?._sessionId
    })
    expect(readOnlySession).toBe(sessionIds[0])
  })

  test('rotates session after inactivity TTL', async ({ page }) => {
    await page.addInitScript(() => {
      const SESSION_COOKIE = '_utua_session'
      const ACTIVITY_COOKIE = '_utua_last_activity'
      const stale = String(Date.now() - 6 * 60 * 1000)
      document.cookie = `${SESSION_COOKIE}=550e8400-e29b-41d4-a716-446655440099; path=/; max-age=3600; SameSite=Lax`
      document.cookie = `${ACTIVITY_COOKIE}=${stale}; path=/; max-age=3600; SameSite=Lax`
    })

    const { bodies } = await setupCollectMock(page)
    await gotoTestLp(page)

    await expect
      .poll(() => bodies.length, { timeout: 10000 })
      .toBeGreaterThan(0)

    const pageSessionId = bodies[0]?.[0]?.context.sessionId
    expect(pageSessionId).toBeDefined()
    expect(pageSessionId).not.toBe('550e8400-e29b-41d4-a716-446655440099')
  })
})
