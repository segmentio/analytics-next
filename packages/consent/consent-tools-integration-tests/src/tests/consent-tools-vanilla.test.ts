/**
 * Tests targeting @segment/analytics-consent-tools
 */

import { ConsentToolsVanillaOptIn } from '../page-objects/consent-tools-vanilla'
import { expect } from 'expect'

const page = new ConsentToolsVanillaOptIn()

afterEach(async () => {
  await page.cleanup()
})

it('should send a track call after waiting for explicit consent', async () => {
  await page.load()

  await page.clickGiveConsent()

  await browser.waitUntil(() => page.getConsentChangedEvents().length, {
    timeout: 20000,
    timeoutMsg: 'Expected a consent change call to be made',
  })

  const consentChangeEvents = page.getConsentChangedEvents()
  expect(consentChangeEvents.length).toBe(1)
  expect(consentChangeEvents[0].event).toEqual('Segment Consent Preference')

  await browser.execute(() => {
    return window.analytics.track('hello')
  })

  const getHelloTrackEvents = () =>
    page.getAllTrackingEvents().find((el) => el.event === 'hello')

  await browser.waitUntil(() => getHelloTrackEvents(), {
    timeout: 20000,
    timeoutMsg: 'Expected a track call to be made',
  })

  expect(getHelloTrackEvents()!.context?.consent).toEqual({
    categoryPreferences: {
      FooCategory1: true,
      FooCategory2: true,
    },
  })
})
