import { test, expect } from '@playwright/test'
import { waitForCondition } from '../../helpers/playwright-utils'
import { IndexPage } from './index-page'
import type { SegmentEvent } from '@segment/analytics-next'

const basicEdgeFn = `const processSignal = (signal) => {}`

test('Collecting signals whenever a user selects an item', async ({ page }) => {
  const indexPage = await new IndexPage().loadAndWait(page, basicEdgeFn, {
    disableSignalsRedaction: true,
    enableSignalsIngestion: true,
  })

  const filterClick = (e: SegmentEvent): boolean => {
    return (
      e.properties!.data.eventType === 'click' &&
      e.properties!.data.target.textContent?.includes('Mint')
    )
  }

  const waitForInteraction = waitForCondition(
    () => {
      const events = indexPage.signalsAPI.getEvents('interaction')
      return events.some(filterClick)
    },
    { errorMessage: 'No interaction signals found' }
  )
  await page.click('#select button')
  await page.getByRole('option', { name: 'Mint' }).click()

  await waitForInteraction
  const signals = indexPage.signalsAPI
    .getEvents('interaction')
    .filter(filterClick)

  expect(signals).toHaveLength(1)
})
