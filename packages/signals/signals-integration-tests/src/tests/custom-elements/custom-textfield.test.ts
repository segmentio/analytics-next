import { test, expect } from '@playwright/test'
import { waitForCondition } from '../../helpers/playwright-utils'
import { IndexPage } from './index-page'

const basicEdgeFn = `globalThis.processSignal = (signal) => {}`

test('Collecting signals whenever a user enters text input and focuses out', async ({
  page,
}) => {
  const indexPage = await new IndexPage().loadAndWait(page, basicEdgeFn, {
    disableSignalsRedaction: true,
    enableSignalsIngestion: true,
  })
  const fillAndConfirm = async (selector: string, text: string) => {
    await page.getByTestId(selector).fill(text)
    await page.getByTestId(selector).press('Enter')
  }
  await Promise.all([
    fillAndConfirm('aria-text-field', 'John Doe'),
    waitForCondition(
      () => indexPage.signalsAPI.getEvents('interaction').length > 0,
      { errorMessage: 'No interaction signals found' }
    ),
  ])
  const interactionSignals = indexPage.signalsAPI.getEvents('interaction')

  const data = expect.objectContaining({
    eventType: 'change',
    listener: 'mutation',
    change: {
      value: 'John Doe',
    },
    target: expect.objectContaining({
      attributes: expect.objectContaining({
        type: 'text',
        value: 'John Doe',
      }),
      tagName: 'INPUT',
      value: 'John Doe',
    }),
  })
  expect(interactionSignals[0].properties!.data).toMatchObject(data)
})
