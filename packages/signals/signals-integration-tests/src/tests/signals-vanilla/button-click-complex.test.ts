import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'

const indexPage = new IndexPage()

const basicEdgeFn = `
    // this is a process signal function
    const processSignal = (signal) => {}`

test.beforeEach(async ({ page }) => {
  await indexPage.loadAndWait(page, basicEdgeFn)
})

test('button click (complex, with nested items)', async () => {
  /**
   * Click a button with nested text, ensure that that correct text shows up
   */
  await Promise.all([
    indexPage.clickComplexButton(),
    indexPage.waitForSignalsApiFlush(),
  ])

  const interactionSignals = indexPage.signalsAPI.getEvents('interaction')
  expect(interactionSignals).toHaveLength(1)
  const data = {
    eventType: 'click',
    target: {
      attributes: {
        id: 'complex-button',
      },
      classList: [],
      id: 'complex-button',
      labels: [],
      name: '',
      nodeName: 'BUTTON',
      tagName: 'BUTTON',
      title: '',
      type: 'submit',
      innerText: expect.any(String),
      textContent: expect.stringContaining(
        'Other Example Button with Nested Text'
      ),
      value: '',
    },
  }

  expect(interactionSignals[0]).toMatchObject({
    event: 'Segment Signal Generated',
    type: 'track',
    properties: {
      type: 'interaction',
      data,
    },
  })
})
