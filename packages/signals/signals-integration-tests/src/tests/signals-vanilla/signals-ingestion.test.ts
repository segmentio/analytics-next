import { test, expect } from '@playwright/test'
import { waitForCondition } from '../../helpers/playwright-utils'
import { IndexPage } from './index-page'

const indexPage = new IndexPage()

const basicEdgeFn = `const processSignal = (signal) => {}`

test('ingestion not enabled -> will not send the signal', async ({ page }) => {
  await indexPage.loadAndWait(page, basicEdgeFn, {
    enableSignalsIngestion: false,
  })

  await indexPage.fillNameInput('John Doe')
  const promise = await indexPage.waitForSignalsApiFlush().catch(() => {})

  await expect(promise).rejects.toThrow()
})

test('ingestion enabled -> will send the signal', async ({ page }) => {
  await indexPage.loadAndWait(page, basicEdgeFn, {
    enableSignalsIngestion: true,
  })

  await Promise.all([
    indexPage.fillNameInput('John Doe'),
    indexPage.waitForSignalsApiFlush(),
  ])

  await waitForCondition(
    () => indexPage.signalsAPI.getEvents('interaction').length > 0,
    { errorMessage: 'No interaction signals found' }
  )

  const interactionSignals = indexPage.signalsAPI.getEvents('interaction')
  expect(interactionSignals.length > 0)
})
