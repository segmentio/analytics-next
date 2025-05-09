import { test, expect } from '@playwright/test'
import OneTrustPage from '../page-objects/onetrust'
test.describe('OneTrust Consent Tests', () => {
  let pageObject: OneTrustPage

  test.beforeEach(async ({ page }) => {
    pageObject = new OneTrustPage(page)
    await pageObject.load()
  })

  test.afterEach(async () => {
    await pageObject.cleanup()
  })

  test('should send a consent changed event when user clicks accept on popup', async () => {
    expect(pageObject.getConsentChangedEvents().length).toBe(0)
    await pageObject.openAlertBoxIfNeeded()
    await pageObject.clickConfirmButtonAndClosePopup()
    await expect.poll(() => pageObject.getConsentChangedEvents().length).toBe(1)
  })
})
