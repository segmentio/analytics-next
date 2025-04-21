/**
 * Playwright Tests targeting @segment/analytics-consent-tools
 *
 * This test verifies that:
 *  - Tracking events do not go through before explicit consent.
 *  - After giving consent, appropriate events are sent with the correct consent context.
 */

import { ConsentToolsVanillaOptIn } from '../../page-objects/consent-tools-vanilla'
import { test, expect } from '@playwright/test'

let pageObject: ConsentToolsVanillaOptIn

test.beforeEach(async ({ page }) => {
  // Initialize the test page object and load the test HTML fixture
  pageObject = new ConsentToolsVanillaOptIn(page)
  await pageObject.load()
})

test.afterEach(async () => {
  // Cleanup local/session storage and reset intercepted requests after each test
  await pageObject.cleanup()
})

test('should send a track call after waiting for explicit consent', async ({
  page,
}) => {
  // Attempt to track an event before consent is given — this should be buffered/blocked
  await page.evaluate(() => {
    void window.analytics.track('buffered')
  })

  // Optional delay to let the network pipeline settle (useful in debugging)
  await page.waitForTimeout(2000)

  // Assert that no events have been tracked yet
  await expect.poll(() => pageObject.getAllTrackingEvents().length).toBe(0)

  // Ensure analytics is loaded before interacting
  await page.waitForFunction(() => typeof window.analytics !== 'undefined')

  // Simulate user giving consent
  await pageObject.clickGiveConsent()

  // Wait until the consent change event is tracked
  await expect
    .poll(() => pageObject.getConsentChangedEvents().length, {
      timeout: 10_000,
    })
    .toBeGreaterThan(0)

  // Validate that the expected consent change event was emitted
  const events = pageObject.getConsentChangedEvents()
  expect(events.length).toBe(1)
  expect(events[0].event).toBe('Segment Consent Preference Updated')

  // Now track a new event "hello" after consent has been given
  await page.evaluate(() => {
    void window.analytics.track('hello')
  })

  // Helper to retrieve the "hello" tracking event
  const getHelloEvent = () =>
    pageObject.getAllTrackingEvents().find((e) => e.event === 'hello')

  // Wait until "hello" event is tracked
  await expect.poll(getHelloEvent).not.toBe(undefined)

  // Validate that the "hello" event includes the correct consent context
  expect((await getHelloEvent())?.context?.consent).toEqual({
    categoryPreferences: {
      FooCategory1: true,
      FooCategory2: true,
    },
  })

  // Now re-check the previously buffered event "buffered"
  const getBufferedEvent = () =>
    pageObject.getAllTrackingEvents().find((e) => e.event === 'buffered')

  // Wait until the "buffered" event is finally flushed and sent
  await expect.poll(getBufferedEvent).not.toBe(undefined)

  // Assert that the flushed "buffered" event also includes the consent context
  expect((await getBufferedEvent())?.context?.consent).toEqual({
    categoryPreferences: {
      FooCategory1: true,
      FooCategory2: true,
    },
  })

  // Optional: print all tracking events for debug purposes
  console.log('All tracking events so far:', pageObject.getAllTrackingEvents())
})
