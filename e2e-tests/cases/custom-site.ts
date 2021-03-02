import { Page } from 'playwright'
import { Analytics } from '../../src/analytics'

declare global {
  interface Window {
    analytics: Analytics
  }
}

export default {
  name: 'custom-site',
  scenario: async function (
    page: Page,
    writeKey?: string,
    ajsVersion?: string
  ) {
    // Go to http://localhost:5000/example/snippet_example/comparison-demo
    await page.goto(
      'http://localhost:5000/example/snippet_example/comparison-demo'
    )

    // Click input[name="writeKey"]
    await page.click('input[name="writeKey"]')

    // Fill input[name="writeKey"]
    await page.fill('input[name="writeKey"]', writeKey!)

    if (ajsVersion === 'next') {
      // Check input[name="next"]
      await page.check('input[name="next"]')
    }

    // Click text="Load"
    await page.click('text="Load"')
    // assert.equal(page.url(), 'http://localhost:5000/example/snippet_example/comparison-demo?writeKey=***REMOVED***');

    // Click text=/.*Track: Product Viewed.*/
    await page.click('text=/.*Track: Product Viewed.*/')

    // Click text="Page: Home"
    await page.click('text="Page: Home"')

    // Click text=/.*Identify: spongebob.*/
    await page.click('text=/.*Identify: spongebob.*/')

    // Click text=/.*Group.*/
    await page.click('text=/.*Group.*/')

    // Click text=/.*Alias.*/
    await page.click('text=/.*Alias.*/')
  },
  getIntegrations: async function (
    page: Page,
    ajsVersion: string
  ): Promise<String[]> {
    let integrations = []

    if (ajsVersion === 'next') {
      integrations = await page.evaluate(() => {
        return window.analytics.queue.plugins
          .map((p: any) => p.name)
          .filter(
            (p: string) => p !== 'Event Validation' && p !== 'Page Enrichment'
          )
      })
    } else {
      integrations = await page.evaluate(() => {
        return Object.keys(window.analytics?.Integrations ?? {})
      })
    }

    return integrations
  },
}
