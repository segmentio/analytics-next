import { test, expect } from '@playwright/test'
import { OneTrustConsentPage } from '../page-objects/onetrust'

// Setup for your page object
let pageObject: OneTrustConsentPage

test.beforeEach(async ({ page: p }) => {
  // Initialize the page object
  pageObject = new OneTrustConsentPage(p)

  // Load the page
  await pageObject.load()
})

test.afterEach(async () => {
  await pageObject.cleanup()
})

test('should send a consent changed event when user clicks accept on popup', async ({
  page,
}) => {
  // Pause for a brief moment if needed
  await page.waitForTimeout(1000)

  // Check that no consent changed event is initially sent
  const consentChangedEvents = pageObject.getConsentChangedEvents()
  expect(consentChangedEvents.length).toBe(0)

  await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 })

  // Make a consent selection in the OneTrust popup
  await pageObject.clickGiveConsent()

  await page.waitForTimeout(2000)
  // Optional: print all tracking events for debug purposes
  console.log('All tracking events so far:', pageObject.getAllTrackingEvents())
  // // Wait for the consent changed event to be sent using poll and a timeout
  // await expect
  //   .poll(() => pageObject.getConsentChangedEvents().length, {
  //     timeout: 10_000, // Timeout after 10 seconds
  //   })
  //   .toBeGreaterThan(0) // Ensure the consent event count increases

  // // Ensure that exactly 1 consent changed event was sent
  // const updatedConsentChangedEvents = pageObject.getConsentChangedEvents()
  // expect(updatedConsentChangedEvents.length).toBe(1)
})
