import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'

const basicEdgeFn = `globalThis.processSignal = (signal) => {}`
let indexPage: IndexPage
test.beforeEach(async ({ page }) => {
  indexPage = await new IndexPage().loadAndWait(page, basicEdgeFn)
})

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
    innerText: 'Other Example Button with Nested Text',
    textContent: 'Other Example Button with Nested Text',
    value: '',
  },
}

test('clicking a button with nested content', async () => {
  /**
   * Click a button with nested text, ensure that that correct text shows up
   */
  await Promise.all([
    indexPage.clickComplexButton(),
    indexPage.waitForSignalsApiFlush(),
  ])

  const interactionSignals = indexPage.signalsAPI.getEvents('interaction')
  expect(interactionSignals).toHaveLength(1)

  expect(interactionSignals[0]).toMatchObject({
    event: 'Segment Signal Generated',
    type: 'track',
    properties: {
      type: 'interaction',
      data,
    },
  })
})

test('clicking the h1 tag inside a button', async () => {
  /**
   * Click the nested text, ensure that that correct text shows up
   */
  await Promise.all([
    indexPage.clickInsideComplexButton(),
    indexPage.waitForSignalsApiFlush(),
  ])

  const interactionSignals = indexPage.signalsAPI.getEvents('interaction')
  expect(interactionSignals).toHaveLength(1)
  expect(interactionSignals[0]).toMatchObject({
    event: 'Segment Signal Generated',
    type: 'track',
    properties: {
      type: 'interaction',
      data,
    },
  })
})
