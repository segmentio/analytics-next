import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'

const indexPage = new IndexPage()

const basicEdgeFn = `const processSignal = (signal) => {}`

test('ingestion not enabled -> will not send the signal', async ({ page }) => {
  await indexPage.loadAndWait(page, basicEdgeFn, {
    enableSignalsIngestion: false,
    flushAt: 1,
  })
  await indexPage.fillNameInput('John Doe')
  await page.waitForTimeout(100)
  expect(indexPage.signalsAPI.getEvents('interaction')).toHaveLength(0)
})

test('ingestion enabled -> will send the signal', async ({ page }) => {
  await indexPage.loadAndWait(page, basicEdgeFn, {
    enableSignalsIngestion: true,
  })

  await Promise.all([
    indexPage.fillNameInput('John Doe'),
    indexPage.waitForSignalsApiFlush(),
  ])

  expect(true).toBe(true)
})
