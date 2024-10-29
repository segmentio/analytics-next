import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'

const indexPage = new IndexPage()

test('should find the most recent signal', async ({ page }) => {
  const basicEdgeFn = `const processSignal = (signal) => {
  if (signal.type === 'interaction' && signal.data.target.id === 'complex-button') {
    const mostRecentSignal = signals.find(signal, 'userDefined')
    if (mostRecentSignal.data.num === 2) {
      analytics.track('correct signal found')
    }
  }
}`

  await indexPage.loadAndWait(page, basicEdgeFn)
  const tapiFlush = indexPage.waitForTrackingApiFlush()
  await indexPage.addUserDefinedSignal({ num: 1 })
  await indexPage.addUserDefinedSignal({ num: 2 })
  await indexPage.clickComplexButton()
  await tapiFlush
  const lastEvent = indexPage.trackingAPI.lastEvent()
  expect(lastEvent.event).toEqual('correct signal found')
})
