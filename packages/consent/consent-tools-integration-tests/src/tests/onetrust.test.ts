/* eslint-disable @typescript-eslint/no-floating-promises */
import page from '../page-objects/onetrust'
import { expect } from 'expect'
import { Context } from '@segment/analytics-next'

declare global {
  interface Window {
    _segmentConsentCalls: any
  }
}

it('should stamp each event', async () => {
  await page.load()

  const commands = [
    `analytics.track("hello world")`,
    `analytics.alias("foo", "bar")`,
    `analytics.page()`,
    `analytics.group("foo", { bar: 123 })`,
    `analytics.identify("bar", { bar: 123 })`,
  ]

  const eventsP = Promise.all<Context>(
    commands.map((cmd) => browser.execute(cmd))
  )

  // should expect an onConsentChanged event
  await page.clickAcceptButtonAndClosePopup()
  ;(await eventsP).forEach((ctx) => {
    expect(
      Object.keys((ctx.event.context as any).consent.categoryPreferences).length
    ).toBeGreaterThan(0)
  })
})

it('should send an onConsentChanged event if there has not been a selection', async () => {
  await page.load()

  // you can also use interceptors, but not clear that will work in saucelabs?
  const listenToConsent = () => {
    browser.execute(() => {
      if (window._segmentConsentCalls === undefined) {
        window._segmentConsentCalls = 0
      }
      window.analytics.on('track', (name) => {
        if (name.includes('Segment Consent')) {
          window._segmentConsentCalls += 1
        }
      })
    })
  }

  listenToConsent()

  // make sure an onConsentChange event is not sent
  await browser.pause(1000)
  await expect(
    browser.execute(() => window._segmentConsentCalls)
  ).resolves.toBe(0)

  // make a consent selection in the OneTrust popup
  await page.clickAcceptButtonAndClosePopup()

  // onConsentChange event should now be sent
  await browser.waitUntil(
    async () => (await browser.execute(() => window._segmentConsentCalls)) === 1
  )
})
