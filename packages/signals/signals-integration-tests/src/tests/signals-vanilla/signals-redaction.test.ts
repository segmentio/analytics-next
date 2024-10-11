import { test, expect } from '@playwright/test'
import { waitForCondition } from '../../helpers/playwright-utils'
import { IndexPage } from './index-page'

const indexPage = new IndexPage()

const basicEdgeFn = `const processSignal = (signal) => {}`

test('redaction enabled -> will XXX the value of text input', async ({
  page,
}) => {
  await indexPage.loadAndWait(page, basicEdgeFn, {
    disableSignalsRedaction: false,
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

  const data = {
    eventType: 'change',
    target: expect.objectContaining({
      name: 'name',
      type: 'text',
      value: 'XXX', // redacted
    }),
  }
  expect(interactionSignals[0].properties!.data).toMatchObject(data)
})

test('redation disabled -> will not touch the value of text input', async ({
  page,
}) => {
  await indexPage.loadAndWait(page, basicEdgeFn, {
    disableSignalsRedaction: true,
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

  const data = {
    eventType: 'change',
    target: expect.objectContaining({
      value: 'John Doe', // noe redacted
    }),
  }
  expect(interactionSignals[0].properties!.data).toMatchObject(data)
})
