import { Page } from 'playwright'

export default {
  name: 'staples',
  scenario: async function (page: Page) {
    // Go to https://www.staples.ca/
    await page.goto('https://www.staples.ca/')

    // Click a[role="button"]
    await page.click('a[role="button"]')
    // assert.equal(page.url(), 'https://www.staples.ca/#');

    // Click text="Brother Ink &"
    await page.click('text="Brother Ink &"')
    // assert.equal(page.url(), 'https://www.staples.ca/collections/brother-ink-toner-8');

    // Click button[aria-label="Add to Cart"]
    await page.click('button[aria-label="Add to Cart"]')
  },
}
