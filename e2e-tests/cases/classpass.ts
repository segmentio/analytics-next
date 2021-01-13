import { Page } from 'playwright'

export default {
  name: 'classpass',
  scenario: async function (page: Page) {
    // Go to https://classpass.com/
    await page.goto('https://classpass.com/')

    // Click text="Get started"
    await page.click('text="Get started"')
    // assert.equal(page.url(), 'https://classpass.com/pricing/getclasspass');

    // Go to https://classpass.com/pricing/vancouver/getclasspass
    await page.goto('https://classpass.com/pricing/vancouver/getclasspass')

    // Click text="At-home workouts"
    await page.click('text="At-home workouts"')
    // assert.equal(page.url(), 'https://classpass.com/try/home-workout-videos');

    // Click text="Explore studios"
    await page.click('text="Explore studios"')
    // assert.equal(page.url(), 'https://classpass.com/search');

    // Click a[aria-label="home"]
    await page.click('a[aria-label="home"]')
    // assert.equal(page.url(), 'https://classpass.com/');

    // Click input[aria-label="Email address"]
    await page.click('input[aria-label="Email address"]')

    // Fill input[aria-label="Email address"]
    await page.fill('input[aria-label="Email address"]', 'test@domain.com')

    // Press Tab
    await page.press('input[aria-label="Email address"]', 'Tab')

    // Fill input[aria-label="City name"]
    await page.fill('input[aria-label="City name"]', 'Vancouver')

    // Click //li[normalize-space(.)='Vancouver, BC, Canada' and normalize-space(@role)='option']
    await page.click(
      "//li[normalize-space(.)='Vancouver, BC, Canada' and normalize-space(@role)='option']"
    )

    // Go to https://classpass.com/pricing/vancouver
    await page.goto('https://classpass.com/pricing/vancouver')

    // Click text="Get your guide"
    await page.click('text="Get your guide"')
  },
}
