/**
 * Playwright Tests targeting @segment/analytics-consent-tools
 *
 * This test verifies that:
 *  - Tracking events are sent before consent (opt-out model).
 *  - Consent change updates are reflected in later events.
 */

import { ConsentToolsVanillaOptOut } from '../page-objects/consent-tools-vanilla'
import { test, expect } from '@playwright/test'

let pageObject: ConsentToolsVanillaOptOut

test.beforeEach(async ({ page }) => {
  pageObject = new ConsentToolsVanillaOptOut(page)
  await pageObject.load()
})

test.afterEach(async () => {
  await pageObject.cleanup()
})

test('Consent Tools Vanilla Opt-out: Should not wait for consent before sending track call', async ({
  page,
}) => {
  // Track an event immediately before any consent is given
  await page.evaluate(() => {
    void window.analytics.track('hello')
  })

  // Consent change should not have happened yet
  let consentChangeEvents = pageObject.getConsentChangedEvents()
  expect(consentChangeEvents.length).toBe(0)

  // Wait for the "hello" event to be sent
  const getHelloTrackEvent = () =>
    pageObject.getAllTrackingEvents().find((e) => e.event === 'hello')

  await expect
    .poll(getHelloTrackEvent, {
      timeout: 30000,
    })
    .not.toBe(undefined)

  expect(
    (await getHelloTrackEvent())?.context?.consent?.categoryPreferences
  ).toEqual({
    FooCategory1: false,
    FooCategory2: false,
  })

  // Simulate user giving consent
  await pageObject.clickGiveConsent()

  // Wait for the consent update to be tracked
  await expect
    .poll(() => pageObject.getConsentChangedEvents().length, {
      timeout: 20000,
    })
    .toBeGreaterThan(0)

  consentChangeEvents = pageObject.getConsentChangedEvents()
  expect(consentChangeEvents.length).toBe(1)
  expect(consentChangeEvents[0].event).toBe(
    'Segment Consent Preference Updated'
  )

  // Track another event after giving consent
  await page.evaluate(() => {
    void window.analytics.track('sup')
  })

  const getSupTrackEvent = () =>
    pageObject.getAllTrackingEvents().find((e) => e.event === 'sup')

  await expect
    .poll(getSupTrackEvent, {
      timeout: 20000,
    })
    .not.toBe(undefined)

  expect(
    (await getSupTrackEvent())?.context?.consent?.categoryPreferences
  ).toEqual({
    FooCategory1: true,
    FooCategory2: true,
  })
})
