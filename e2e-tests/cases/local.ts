import { Page } from 'playwright'

export default {
  name: 'local',
  scenario: async function (page: Page) {
    // Go to http://localhost:5000/example/snippet_example/
    await page.goto('http://localhost:5000/example/snippet_example/')

    // Click text="Track"
    await page.click('text="Track"')

    // Click text="Identify"
    await page.click('text="Identify"')

    // Fill textarea[name="event"]
    await page.fill(
      'textarea[name="event"]',
      `{
    "name": "hi",
    "properties": {
      "person":"julio"
    },
    "traits": { },
    "options": { }
  }`
    )

    // Click text="Track"
    await page.click('text="Track"')

    // Click text="Identify"
    await page.click('text="Identify"')
  },
}
