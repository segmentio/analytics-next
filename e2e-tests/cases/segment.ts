import { Page } from 'playwright'

export default {
  name: 'segment',
  scenario: async function (page: Page) {
    // Go to https://segment.com/
    await page.goto('https://segment.com/')

    // Click text=/.*Explore Segment for Marketing.*/
    await page.click('text=/.*Explore Segment for Marketing.*/')
    // assert.equal(page.url(), 'https://segment.com/marketing/');

    // Click text=/.*Explore Audiences.*/
    await page.click('text=/.*Explore Audiences.*/')
    // assert.equal(page.url(), 'https://segment.com/product/personas/');

    // Click text=/.*Explore the Connections produc.*/
    await page.click('text=/.*Explore the Connections produc.*/')
    // assert.equal(page.url(), 'https://segment.com/product/connections/');

    // Click text="Replay your data"
    await page.click('text="Replay your data"')

    // Click text="Observe your data"
    await page.click('text="Observe your data"')

    // Click img[alt="Logo Segment"]
    await page.click('img[alt="Logo Segment"]')
    // assert.equal(page.url(), 'https://segment.com/');

    // Click text=/.*Explore Segment for Product.*/
    await page.click('text=/.*Explore Segment for Product.*/')
    // assert.equal(page.url(), 'https://segment.com/product/');

    // Click text="Attribute feature experiments"
    await page.click('text="Attribute feature experiments"')

    // Click text="Measure & improve KPIs"
    await page.click('text="Measure & improve KPIs"')

    // Click //div[2]/div[1]/div[1]/a/*[local-name()="svg" and normalize-space(.)='Segment logo']
    await page.click(
      '//div[2]/div[1]/div[1]/a/*[local-name()="svg" and normalize-space(.)=\'Segment logo\']'
    )
    // assert.equal(page.url(), 'https://segment.com/');
  },
}
