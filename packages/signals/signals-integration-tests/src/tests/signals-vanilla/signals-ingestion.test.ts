import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'
import { waitForCondition } from '../../helpers/playwright-utils'

const indexPage = new IndexPage()

const basicEdgeFn = `const processSignal = (signal) => {}`

test('debug ingestion disabled and sample rate 0 -> will not send the signal', async ({
  page,
}) => {
  await indexPage.loadAndWait(
    page,
    basicEdgeFn,
    {
      enableSignalsIngestion: false,
      flushAt: 1,
    },
    { sampleRate: 0 }
  )
  await indexPage.fillNameInput('John Doe')
  await page.waitForTimeout(100)
  expect(indexPage.signalsAPI.getEvents('interaction')).toHaveLength(0)
})

test('debug ingestion enabled and sample rate 0 -> will send the signal', async ({
  page,
}) => {
  await indexPage.loadAndWait(
    page,
    basicEdgeFn,
    {
      enableSignalsIngestion: true,
    },
    { sampleRate: 0 }
  )

  await Promise.all([
    indexPage.fillNameInput('John Doe'),
    indexPage.waitForSignalsApiFlush(),
  ])

  expect(true).toBe(true)
})

test('debug ingestion disabled and sample rate 1 -> will send the signal', async ({
  page,
}) => {
  await indexPage.loadAndWait(
    page,
    basicEdgeFn,
    {
      flushAt: 1,
      enableSignalsIngestion: false,
    },
    {
      sampleRate: 1,
    }
  )
  await Promise.all([
    indexPage.fillNameInput('John Doe'),
    waitForCondition(
      () => indexPage.signalsAPI.getEvents('interaction').length > 0
    ),
  ])
})
