import { Page } from 'playwright'

export default {
  name: 'bonobos',
  scenario: async function (page: Page) {
    // Go to https://bonobos.com/
    await page.goto('https://bonobos.com/')

    // Go to https://bonobos.com/shop/new-arrivals
    await page.goto('https://bonobos.com/shop/new-arrivals')

    // Click input[aria-label="Your email address"]
    await page.click('input[aria-label="Your email address"]')

    // Fill input[aria-label="Your email address"]
    await page.fill('input[aria-label="Your email address"]', 'foo')

    // Click button[aria-label="submit"]
    await page.click('button[aria-label="submit"]')

    // Click input[aria-label="Your email address"]
    await page.click('input[aria-label="Your email address"]')

    // Fill input[aria-label="Your email address"]
    await page.fill('input[aria-label="Your email address"]', 'foo@,com')

    // Click button[aria-label="submit"]
    await page.click('button[aria-label="submit"]')

    // Click input[aria-label="Your email address"]
    await page.click('input[aria-label="Your email address"]')

    // Click input[aria-label="Your email address"]
    await page.click('input[aria-label="Your email address"]')

    // Press ArrowLeft
    await page.press('input[aria-label="Your email address"]', 'ArrowLeft')

    // Press ArrowLeft
    await page.press('input[aria-label="Your email address"]', 'ArrowLeft')

    // Press ArrowLeft
    await page.press('input[aria-label="Your email address"]', 'ArrowLeft')

    // Fill input[aria-label="Your email address"]
    await page.fill('input[aria-label="Your email address"]', 'foo@s.com')

    // Click button[aria-label="submit"]
    await page.click('button[aria-label="submit"]')

    // Click button[aria-label="Close the Dialog Window"]
    await page.click('button[aria-label="Close the Dialog Window"]')

    // Click text="Clothing"
    await page.click('text="Clothing"')

    // Go to https://bonobos.com/shop/extended-sizes/bottoms
    await page.goto('https://bonobos.com/shop/extended-sizes/bottoms')

    // Click //div[normalize-space(.)='Cart icon: silhouette of a shopping bag']
    await page.click("//div[normalize-space(.)='Cart icon: silhouette of a shopping bag']")

    // Click button[aria-label="Close the Cart"]
    await page.click('button[aria-label="Close the Cart"]')

    // Click text="Email Address"
    await page.click('text="Email Address"')

    // Fill input[aria-label="Your email address"]
    await page.fill('input[aria-label="Your email address"]', 'daniel@segment.com')

    // Click button[aria-label="submit"]
    await page.click('button[aria-label="submit"]')
  },
}
