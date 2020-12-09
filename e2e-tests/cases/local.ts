import { Page } from 'playwright'
import { startLocalServer } from '../recorder'

export default {
  name: 'local',
  scenario: async function (page: Page) {
    const url = await startLocalServer()
    await page.goto(`${url}/example/snippet_example/index-local`)

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
