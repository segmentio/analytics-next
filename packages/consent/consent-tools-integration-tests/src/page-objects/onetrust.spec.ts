/**
 * Playwright Test targeting @segment/analytics-consent-wrapper-onetrust
 *
 * This test verifies that a consent changed event is sent
 * when the user clicks "Accept" on the OneTrust popup.
 */

import page from '../page-objects/onetrust'
import { test, expect } from '@playwright/test'

test.afterEach(async () => {
  await page.cleanup()
})

test('should send a consent changed event when user clicks accept on popup', async ({
  page: pwPage,
}) => {
  await page.load()

  // Optional pause (if needed for visual confirmation or stability)
  await pwPage.waitForTimeout(1000)

  // Initially, no consent change events should be sent
  expect(page.getConsentChangedEvents().length).toBe(0)

  // Simulate user accepting consent via OneTrust popup
  await page.clickAcceptButtonAndClosePopup()

  // Wait for one consent change event to be sent
  await expect
    .poll(() => page.getConsentChangedEvents().length, {
      timeout: 30000,
      interval: 100,
    })
    .toBe(1)
})
