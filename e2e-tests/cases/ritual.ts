import { Page } from 'playwright'

export default {
  name: 'ritual',
  scenario: async function (page: Page) {
    await page.goto('https://ritual.com/')

    await page.click('text="Menu"')

    await page.click("//h3[normalize-space(.)='Shop All']")

    await page.click('text="$30 — Add to Cart"')
  },
}
