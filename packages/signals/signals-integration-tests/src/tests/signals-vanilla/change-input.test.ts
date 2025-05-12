import { test, expect } from '@playwright/test'
import { waitForCondition } from '../../helpers/playwright-utils'
import { IndexPage } from './index-page'

const basicEdgeFn = `function processSignal(signal) {}`

test('Collecting signals whenever a user enters text input', async ({
  page,
}) => {
  /**
   * Input some text into the input field, see if the signal is emitted correctly
   */
  const indexPage = await new IndexPage().loadAndWait(page, basicEdgeFn, {
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
          id: '',
          attributes: {
            for: 'name',
          },
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
