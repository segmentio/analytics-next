import page from '../page-objects/consent-tools-vanilla'
import { expect } from 'expect'

// Verify that the consent tools wrapper is working as expected (no OneTrust)
it('should stamp each event', async () => {
  await page.load()

  await browser.waitUntil(
    async () => (await browser.execute('typeof window.analytics')) !== undefined
  )

  const ctx = await browser.execute(
    `return window.analytics.track('hello world')`
  )

  expect((ctx.event.context as any).consent).toEqual({
    categoryPreferences: {
      Advertising: true,
      Analytics: true,
    },
  })
})
