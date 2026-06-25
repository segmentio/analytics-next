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

    await expect
      .poll(
        () =>
          page.evaluate(
            () => window.localStorage.getItem('utua_event_queue') !== null
          ),
        { timeout: 5000 }
      )
      .toBe(true)

    failCollect = false

    await expect
      .poll(
        () =>
          bodies.some((b) => b?.some((e) => e.event === 'impression') ?? false),
        { timeout: 20000 }
      )
      .toBe(true)
  })

  test('persists queue in localStorage and recovers after page reload', async ({
    page,
  }) => {
    let failCollect = true
    const messageIdsBeforeReload: string[] = []
    const bodiesAfterRecovery: ReturnType<typeof parseCollectBody>[] = []

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
        bodiesAfterRecovery.push(body)
      }
      return route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, queued: body?.length ?? 0 }),
      })
    })

    await gotoTestLp(page)

    await page.click('#track-impression')
    await expect
      .poll(
        () =>
          page.evaluate(
            () => window.localStorage.getItem('utua_event_queue') !== null
          ),
        { timeout: 5000 }
      )
      .toBe(true)

    // Collect messageIds from localStorage before reload
    messageIdsBeforeReload.push(
      ...(await page.evaluate(() => {
        try {
          const raw = window.localStorage.getItem('utua_event_queue')
          if (!raw) return []
          const queue = JSON.parse(raw) as Array<{
            event?: string
            messageId?: string
          }>
          return queue.map((e) => e.messageId ?? '').filter(Boolean)
        } catch {
          return []
        }
      }))
    )
    expect(messageIdsBeforeReload.length).toBeGreaterThan(0)

    // Reload the page — collector still failing, queue persists in localStorage
    await page.reload()
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            try {
              const raw = window.localStorage.getItem('utua_event_queue')
              if (!raw) return false
              return JSON.parse(raw).length > 0
            } catch {
              return false
            }
          }),
        { timeout: 5000 }
      )
      .toBe(true)

    const messageIdsAfterReload = await page.evaluate(() => {
      try {
        const raw = window.localStorage.getItem('utua_event_queue')
        if (!raw) return []
        const queue = JSON.parse(raw) as Array<{
          event?: string
          messageId?: string
        }>
        return queue.map((e) => e.messageId ?? '').filter(Boolean)
      } catch {
        return []
      }
    })
    expect(messageIdsAfterReload.length).toBeGreaterThan(0)

    const afterSet = new Set(messageIdsAfterReload)
    const survived = messageIdsBeforeReload.filter((id) => afterSet.has(id))
    expect(survived.length).toBeGreaterThan(0)

    // Recover collector and verify delivery
    failCollect = false
    await page.reload()
    await expect
      .poll(
        () =>
          page.evaluate(
            () => window.localStorage.getItem('utua_event_queue') !== null
          ),
        { timeout: 5000 }
      )
      .toBe(true)

    await page.click('#track-impression')

    // After collector recovers, the reloaded page should deliver the persisted events
    await expect
      .poll(
        () =>
          bodiesAfterRecovery.some(
            (b) => b?.some((e) => e.event === 'impression') ?? false
          ),
        { timeout: 20000 }
      )
      .toBe(true)

    const queueAfterRecovery = await page.evaluate(() => {
      try {
        return window.localStorage.getItem('utua_event_queue')
      } catch {
        return null
      }
    })
    expect(queueAfterRecovery).toBeNull()
  })
})
