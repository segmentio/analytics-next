import { Page } from 'playwright'

export default {
  name: 'doordash',
  scenario: async function (page: Page) {
    // Go to https://www.doordash.com/
    await page.goto('https://www.doordash.com/')

    // Go to https://www.doordash.com/en-US
    await page.goto('https://www.doordash.com/en-US')

    // Click input[aria-label="Your delivery address"]
    await page.click('input[aria-label="Your delivery address"]')

    // Fill input[aria-label="Your delivery address"]
    await page.fill(
      'input[aria-label="Your delivery address"]',
      '1050 homer st'
    )

    // Click text=/.*1050 Homer Street, Vancouver, .*/
    await page.click('text=/.*1050 Homer Street, Vancouver, .*/')

    // Go to https://www.doordash.com/en-US?newUser=true
    await page.goto('https://www.doordash.com/en-US?newUser=true')

    // Click text="7-Eleven"
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://www.doordash.com/store/7-eleven-vancouver-992447/en-US' }*/),
      page.click('text="7-Eleven"'),
    ])

    // Click //span/div/div[normalize-space(.)="Ben & Jerry's - 500 ml$6.99"]
    await page.click(
      '//span/div/div[normalize-space(.)="Ben & Jerry\'s - 500 ml$6.99"]'
    )
  },
}
