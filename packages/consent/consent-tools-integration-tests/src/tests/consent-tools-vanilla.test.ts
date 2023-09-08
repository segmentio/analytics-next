import page from '../page-objects/consent-tools-vanilla'
import { expect } from 'expect'

// Verify that the consent tools wrapper is working as expected (no OneTrust)
it('should stamp each event', async () => {
  await page.load()

  const ctx = await browser.execute(() => {
    return window.analytics.track('hello')
  })

  expect((ctx.event.context as any).consent).toEqual({
    categoryPreferences: {
      Advertising: true,
      Analytics: true,
    },
  })
})
