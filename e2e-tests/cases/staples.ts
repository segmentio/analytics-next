import { Page } from 'playwright'

export default {
  name: 'staples',
  scenario: async function (page: Page) {
    // Go to https://www.staples.ca/
    await page.goto('https://www.staples.ca/')

    // Click input[aria-label="Search for products, services and articles"]
    await page.click(
      'input[aria-label="Search for products, services and articles"]'
    )

    // Fill input[aria-label="Search for products, services and articles"]
    await page.fill(
      'input[aria-label="Search for products, services and articles"]',
      'monitors'
    )

    // Press Enter
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://www.staples.ca/search?query=monitors' }*/),
      page.press(
        'input[aria-label="Search for products, services and articles"]',
        'Enter'
      ),
    ])

    // Click text=/.*On Sale.*/
    await page.click('text=/.*On Sale.*/')
    // assert.equal(page.url(), 'https://www.staples.ca/search?query=monitors&indices[shopify_products][refinementList][named_tags.Sale][0]=1&indices[shopify_products][page]=1&indices[shopify_products][configure][getRankingInfo]=true&indices[shopify_products][configure][userToken]=1621524863688825&indices[shopify_products][configure][clickAnalytics]=true&indices[shopify_products][configure][hitsPerPage]=32&indices[shopify_products][configure][filters]=tags:"en_CA"&indices[content_en][configure][hitsPerPage]=8');

    // Click button[aria-label="Add to Cart"]
    await page.click('button[aria-label="Add to Cart"]')

    // Click text="View Cart"
    await page.click('text="View Cart"')
    // assert.equal(page.url(), 'https://www.staples.ca/cart');

    // Click span[aria-label="increment"]
    await page.click('span[aria-label="increment"]')

    // Click span[aria-label="increment"]
    await page.click('span[aria-label="increment"]')

    // Click span[aria-label="increment"]
    await page.click('span[aria-label="increment"]')

    // Click input[name="checkout"]
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://checkout.staples.ca/' }*/),
      page.click('input[name="checkout"]'),
    ])
  },
}
