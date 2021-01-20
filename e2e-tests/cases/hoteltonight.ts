import { Page } from 'playwright'

export default {
  name: 'hoteltonight',
  scenario: async function (page: Page) {
    // Go to https://www.hoteltonight.com/
    await page.goto('https://www.hoteltonight.com/')

    // Click text="Go"
    await page.click('text="Go"')
    // assert.equal(page.url(), 'https://www.hoteltonight.com/s/vancouver-bc?startDate=2021-01-20');

    // Click //span
    await page.click('//span')
  },
}
