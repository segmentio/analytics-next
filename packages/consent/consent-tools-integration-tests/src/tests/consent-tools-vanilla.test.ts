import page from '../page-objects/consent-tools-vanilla'
import { expect } from 'expect'

// Verify that the consent tools wrapper is working as expected (no OneTrust)
it('should stamp each event', async () => {
  await page.load()

  await browser.waitUntil(
    async () => (await browser.execute('typeof window.analytics')) !== undefined
  )

  const responses = await browser.execute(() =>
    window.analytics.track('hello world')
  )

  expect((responses.event.context as any).consent).toEqual({
    categoryPreferences: {
      Advertising: true,
      Analytics: true,
    },
  })
})
