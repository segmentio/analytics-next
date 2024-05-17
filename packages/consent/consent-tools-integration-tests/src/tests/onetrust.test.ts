/**
 * Tests targeting @segment/analytics-consent-wrapper-onetrust
 */

import page from '../page-objects/onetrust'
import { expect } from 'expect'

declare global {
  interface Window {
    _segmentConsentCalls: number
  }
}

afterEach(async () => {
  await page.cleanup()
})

it('should send a consent changed event when user clicks accept on popup', async () => {
  await page.load()

  await browser.pause(1000)
  await expect(page.getConsentChangedEvents().length).toBe(0)

  // make a consent selection in the OneTrust popup
  await page.clickAcceptButtonAndClosePopup()

  // 1 consent changed event should now be sent
  await browser.waitUntil(
    () => {
      return page.getConsentChangedEvents().length === 1
    },
    {
      interval: 100,
      timeout: 30000,
      timeoutMsg: `Expected 1 consent changed event to be sent, got: ${
        page.getConsentChangedEvents().length
      }`,
    }
  )
})
