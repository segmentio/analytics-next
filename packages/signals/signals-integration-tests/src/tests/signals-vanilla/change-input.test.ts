import { test, expect } from '@playwright/test'
import { waitForCondition } from '../../helpers/playwright-utils'
import { IndexPage } from './index-page'

const indexPage = new IndexPage()

const basicEdgeFn = `const processSignal = (signal) => {}`

test('Collecting signals whenever a user enters text input', async ({
  page,
}) => {
  /**
   * Input some text into the input field, see if the signal is emitted correctly
   */
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

  const data = {
    eventType: 'change',
    target: expect.objectContaining({
      attributes: expect.objectContaining({
        type: 'text',
        id: 'name',
        name: 'name',
      }),
      classList: [],
      id: 'name',
      labels: [
        {
          textContent: 'Name:',
        },
      ],
      name: 'name',
      nodeName: 'INPUT',
      tagName: 'INPUT',
      value: 'John Doe',
    }),
  }
  expect(interactionSignals[0].properties!.data).toMatchObject(data)
})
