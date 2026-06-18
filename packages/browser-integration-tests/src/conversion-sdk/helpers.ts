import type { Page, Route } from '@playwright/test'
import { expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

export type CollectEventPayload = {
  type: string
  event?: string
  context: Record<string, unknown>
  properties?: Record<string, unknown>
  traits?: Record<string, unknown>
}

/** Native analytics-next POST body: JSON array of events. */
export type CollectBody = CollectEventPayload[]

export function parseCollectBody(raw: string | null): CollectBody | null {
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed as CollectBody
    }
    return null
  } catch {
    return null
  }
}

export function sdkBundlePath(): string {
  return path.resolve(__dirname, '../../../browser/dist/umd/sdk.min.js')
}

export function assertSdkBundleExists(): void {
  const bundle = sdkBundlePath()
  if (!fs.existsSync(bundle)) {
    throw new Error(
      `Missing ${bundle}. Run: yarn workspace @segment/analytics-next build:conversion-sdk`
    )
  }
}

export async function setupCollectMock(
  page: Page,
  onCollect?: (body: CollectBody) => void
): Promise<{ bodies: CollectBody[] }> {
  const bodies: CollectBody[] = []

  await page.route('**/collect', async (route: Route) => {
    const request = route.request()
    if (request.method() !== 'POST') {
      return route.continue()
    }

    const body = parseCollectBody(request.postData())
    if (body) {
      bodies.push(body)
      onCollect?.(body)
    }

    return route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        queued: body?.length ?? 0,
      }),
    })
  })

  return { bodies }
}

export async function gotoTestLp(
  page: Page,
  search = '?utm_source=e2e&utm_campaign=test'
): Promise<void> {
  await page.goto(`/conversion-sdk/test-lp.html${search}`)
  await page.waitForFunction(() => {
    const w = window as unknown as {
      analytics?: { loaded?: boolean }
    }
    return w.analytics?.loaded === true
  })
}

export function findEvent(
  body: CollectBody,
  eventName: string
): CollectEventPayload | undefined {
  return body.find(
    (e) => e.event === eventName || (eventName === 'page' && e.type === 'page')
  )
}

export function expectNormalizeReadyEvent(
  body: CollectBody,
  eventName: string
): void {
  const event = findEvent(body, eventName)
  expect(event).toBeDefined()
  const ctx = event?.context ?? {}
  expect(typeof ctx.sessionId).toBe('string')
  expect(ctx.session_id).toBeUndefined()
  const campaign = ctx.campaign as
    | { source?: string; name?: string }
    | undefined
  if (campaign?.source) {
    expect(typeof campaign.source).toBe('string')
  }
}
