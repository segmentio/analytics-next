import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'

const basicEdgeFn = `
    globalThis.processSignal = (signal) => {
      // test that constants are properly injected
      if (typeof EventType !== 'object') {
        throw new Error('EventType is missing?')
      }
       if (typeof SignalType !== 'object') {
         throw new Error('SignalType is missing?')
      }
      if (typeof NavigationAction !== 'object') {
        throw new Error('NavigationAction is missing?')
       }

      if (signal.type === SignalType.Interaction) { 
        const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
        analytics.track(eventName, signal.data)
      }
  }`

let indexPage: IndexPage

test.beforeEach(async ({ page }) => {
  indexPage = await new IndexPage().loadAndWait(page, basicEdgeFn)
})

test('constants should be accessible in the runtime', async () => {
  /**
   * Make a button click, see ifdom.window.NavigationAction.URLChange it:
   * - creates an interaction signal that sends to the signals endpoint
   * - creates an analytics event that sends to the tracking endpoint
   */
  await Promise.all([
    indexPage.clickButton(),
    indexPage.waitForTrackingApiFlush(),
  ])

  const analyticsReqJSON = indexPage.trackingAPI.lastEvent()
  expect(analyticsReqJSON).toMatchObject({
    event: 'click [interaction]',
  })
})
