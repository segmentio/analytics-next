/**
 * Tests targeting @segment/analytics-consent-tools
 */

import { ConsentToolsVanillaOptOut } from '../page-objects/consent-tools-vanilla'
import { expect } from 'expect'

const page = new ConsentToolsVanillaOptOut()

afterEach(async () => {
  await page.cleanup()
})
it('should not wait for consent before sending track call', async () => {
  await page.load()

  await browser.execute(() => {
    return window.analytics.track('hello')
  })

  let consentChangeEvents = page.getConsentChangedEvents()
  expect(consentChangeEvents.length).toBe(0)

  const getHelloTrackEvent = () =>
    page.getAllTrackingEvents().find((el) => el.event === 'hello')

  await browser.waitUntil(() => getHelloTrackEvent(), {
    interval: 500,
    timeout: 20000,
    timeoutMsg: 'Expected a "hello" track call to be made',
  })
  expect(getHelloTrackEvent()?.context?.consent.categoryPreferences).toEqual({
    FooCategory1: false,
    FooCategory2: false,
  })

  await page.clickGiveConsent()
  await browser.waitUntil(() => page.getConsentChangedEvents().length, {
    interval: 500,
    timeout: 20000,
    timeoutMsg: 'Expected a consent change call to be made',
  })
  consentChangeEvents = page.getConsentChangedEvents()
  expect(consentChangeEvents.length).toBe(1)
  expect(consentChangeEvents[0].event).toEqual('Segment Consent Preference')
  await browser.execute(() => {
    return window.analytics.track('sup')
  })
  const getSupTrackEvent = () =>
    page.getAllTrackingEvents().find((el) => el.event === 'sup')
  await browser.waitUntil(() => getSupTrackEvent(), {
    interval: 500,
    timeout: 20000,
    timeoutMsg: 'Expected a "sup" track call to be made',
  })

  expect(getSupTrackEvent()?.context?.consent.categoryPreferences).toEqual({
    FooCategory1: true,
    FooCategory2: true,
  })
})
