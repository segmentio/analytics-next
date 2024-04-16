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

  void browser.execute(() => {
    return window.analytics.track('buffered')
  })

  try {
    // we don't expect any tracking events to go through yet
    await browser.waitUntil(() => page.getAllTrackingEvents().length, {
      timeout: 7000,
    })
    throw new Error('Expected no track calls to be made')
  } catch (err) {
    // expected to fail
  }

  await page.clickGiveConsent()

  await browser.waitUntil(() => page.getConsentChangedEvents().length, {
    timeout: 20000,
    timeoutMsg: 'Expected a consent change call to be made',
  })

  const consentChangeEvents = page.getConsentChangedEvents()
  expect(consentChangeEvents.length).toBe(1)
  expect(consentChangeEvents[0].event).toEqual('Segment Consent Preference')

  await browser.waitUntil(() => page.fetchIntegrationReqs.length, {
    timeout: 20000,
    timeoutMsg: 'Expected integrations/destinations to be fetched',
  })

  await browser.execute(() => {
    return window.analytics.track('hello')
  })

  const getHelloTrackEvents = () =>
    page.getAllTrackingEvents().find((el) => el.event === 'hello')

  await browser.waitUntil(() => getHelloTrackEvents(), {
    timeout: 20000,
    timeoutMsg: 'Expected a hello track call to be made',
  })

  expect(getHelloTrackEvents()!.context?.consent).toEqual({
    categoryPreferences: {
      FooCategory1: true,
      FooCategory2: true,
    },
  })

  const getBufferTrackEvents = () =>
    page.getAllTrackingEvents().find((el) => el.event === 'buffered')

  await browser.waitUntil(() => getBufferTrackEvents(), {
    timeout: 20000,
    timeoutMsg: 'Expected a "BUFFER" track call to be made',
  })

  expect(getBufferTrackEvents()!.context?.consent).toEqual({
    categoryPreferences: {
      FooCategory1: true,
      FooCategory2: true,
    },
  })
})
