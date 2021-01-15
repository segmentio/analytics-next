import { Page } from 'playwright'

export default {
  name: 'ifit',
  scenario: async function (page: Page) {
    // Go to https://www.ifit.com/
    await page.goto('https://www.ifit.com/')

    // Click text="About"
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://www.ifit.com/aboutus' }*/),
      page.click('text="About"'),
    ])

    // Click text="Contact us"
    await page.click('text="Contact us"')

    // Go to https://www.ifit.com/contactus
    await page.goto('https://www.ifit.com/contactus')

    // Click text="Careers"
    const [page2] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('text="Careers"'),
    ])

    // Close page
    await page2.close()

    // Click text="Log in"
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://www.ifit.com/login' }*/),
      page.click('text="Log in"'),
    ])

    // Click text="Create account"
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://www.ifit.com/activate' }*/),
      page.click('text="Create account"'),
    ])

    // Click //a[normalize-space(.)='Start your free trial']
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://www.ifit.com/activate-sign-up' }*/),
      page.click("//a[normalize-space(.)='Start your free trial']"),
    ])
  },
}
