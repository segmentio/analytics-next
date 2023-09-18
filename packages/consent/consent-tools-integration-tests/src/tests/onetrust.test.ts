/**
 * Verify that @segment/analytics-consent-wrapper-onetrust is working as expected
 */

import page from '../page-objects/onetrust'
import { expect } from 'expect'

declare global {
  interface Window {
    _segmentConsentCalls: number
  }
}

afterEach(async () => {
  await page.clearStorage()
})

it('should send a consent changed event when user clicks accept on popup', async () => {
  await page.load()

  const { getConsentChangedCallCount } = await page.detectConsentChanged()

  await browser.pause(1000)
  await expect(getConsentChangedCallCount()).resolves.toBe(0)

  // make a consent selection in the OneTrust popup
  await page.clickAcceptButtonAndClosePopup()

  // 1 consent changed event should now be sent
  await browser.waitUntil(
    async () => (await getConsentChangedCallCount()) === 1
  )
})
