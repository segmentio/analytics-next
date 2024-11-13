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

test('never sends signal when sample rate is 0', async ({ page }) => {
  await indexPage.loadAndWait(
    page,
    basicEdgeFn,
    {
      flushAt: 1,
      enableSignalsIngestion: false,
    },
    undefined,
    {
      edgeFunction: {
        downloadURL: 'https://cdn.edgefn.segment.com/MY-WRITEKEY/foo.js',
        version: 1,
      },
      autoInstrumentationSettings: {
        sampleRate: 0,
      },
    }
  )
  await indexPage.fillNameInput('John Doe')
  await page.waitForTimeout(100)
  expect(indexPage.signalsAPI.getEvents('interaction')).toHaveLength(0)
})

test('always sends signal when sample rate is 1', async ({ page }) => {
  await indexPage.loadAndWait(
    page,
    basicEdgeFn,
    {
      flushAt: 1,
      enableSignalsIngestion: false,
    },
    undefined,
    {
      edgeFunction: {
        downloadURL: 'https://cdn.edgefn.segment.com/MY-WRITEKEY/foo.js',
        version: 1,
      },
      autoInstrumentationSettings: {
        sampleRate: 1,
      },
    }
  )
  await indexPage.fillNameInput('John Doe')
  expect(indexPage.signalsAPI.getEvents('interaction')).toHaveLength(1)
})
