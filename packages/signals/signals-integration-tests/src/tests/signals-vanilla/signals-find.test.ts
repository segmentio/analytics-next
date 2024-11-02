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
  await indexPage.addUserDefinedSignal({ num: 1 })
  await indexPage.addUserDefinedSignal({ num: 2 })
  await indexPage.clickComplexButton()
  await page.waitForFunction(() => window.segmentEvents.length === 1)
  const events = await page.evaluate(() => window.segmentEvents)
  expect(events[0]).toEqual('correct signal found')
})

test('should work with other signals', async ({ page }) => {
  const basicEdgeFn = `const processSignal = (signal) => {
    if (signal.type === 'interaction' && signal.data.eventType === 'click') {
        const oldSignal = signals.find(signal, 'userDefined', (s) => s.data.order === 'old')
        const oldestSignal = signals.find(oldSignal, 'userDefined')
        analytics.track('order: ' + oldestSignal.data.order)
    }
}`

  await indexPage.loadAndWait(page, basicEdgeFn)
  await indexPage.addUserDefinedSignal({ order: 'oldest' })
  await indexPage.addUserDefinedSignal({ order: 'old' })
  await indexPage.addUserDefinedSignal({ order: 'young' })
  await indexPage.clickButton()
  await page.waitForFunction(() => window.segmentEvents.length === 1)
  const events = await page.evaluate(() => window.segmentEvents)
  expect(events[0]).toEqual('order: oldest')
})
