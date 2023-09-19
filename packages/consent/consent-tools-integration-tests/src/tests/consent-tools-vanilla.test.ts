/**
 * Tests targeting @segment/analytics-consent-tools
 */

import page from '../page-objects/consent-tools-vanilla'
import { expect } from 'expect'

it('should stamp each event', async () => {
  await page.load()

  const ctx = await browser.execute(() => {
    return window.analytics.track('hello')
  })

  expect((ctx.event.context as any).consent).toEqual({
    categoryPreferences: {
      FooCategory1: true,
      FooCategory2: true,
    },
  })
})
