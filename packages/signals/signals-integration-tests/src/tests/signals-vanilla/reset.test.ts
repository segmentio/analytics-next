import { test, expect } from '@playwright/test'
import { waitForCondition } from '../../helpers/playwright-utils'
import { IndexPage } from './index-page'
import { pTimeout } from '@segment/analytics-core'

/**
 * If a signal is generated, the signal buffer should be reset
 * when the user clicks on the complex button.
 */
const edgeFn = `function processSignal(signal) {
  // create a custom signal to echo out the current signal buffer
  if (signal.type === 'userDefined') {
    analytics.track('current signal buffer', { signalBuffer: signals.signalBuffer })
  }
    
  // clicking the complex button to clear the signal buffer
  if (signal.type === 'interaction' && signal.data.eventType === 'click' && signal.data.target?.id === 'complex-button') {
    analytics.reset()
  }
}`

test('calls analytics.reset, and resets the signalBuffer after clear', async ({
  page,
}) => {
  const indexPage = await new IndexPage().loadAndWait(page, edgeFn)

  await indexPage.addUserDefinedSignal({ num: 1 })
  const resetCalled = page.evaluate<any>(() => {
    return new Promise((resolve) => {
      window.analytics.on('reset', resolve)
    })
  })

  await waitForCondition(() => indexPage.trackingAPI.getEvents().length > 0, {
    errorMessage:
      'No track events found, should have an event with hasSignalsInBuffer: true',
  })
  const events = indexPage.trackingAPI.getEvents()
  const buffer = events[0].properties!.signalBuffer
  expect(buffer[0]).toMatchObject({ type: 'userDefined' })
  expect(buffer[1]).toMatchObject({ type: 'navigation' })

  indexPage.trackingAPI.clear()
  await indexPage.clickComplexButton()
  await pTimeout(resetCalled, 5000)
  await indexPage.addUserDefinedSignal({ num: 2 })
  await waitForCondition(() => indexPage.trackingAPI.getEvents().length > 0, {
    errorMessage:
      'No track events found, should only have one event in the buffer (the current signal)',
  })
  const events2 = indexPage.trackingAPI.getEvents()
  const buffer2 = events2[0].properties!.signalBuffer
  expect(buffer2).toHaveLength(1)
  expect(buffer2[0]).toMatchObject({ type: 'userDefined' })
})
