/* eslint-disable @typescript-eslint/no-floating-promises */
import page from '../page-objects/onetrust'
import { expect } from 'expect'
import { Context } from '@segment/analytics-next'

declare global {
  interface Window {
    _segmentConsentCalls: number
  }
}

afterEach(async () => {
  await page.clearStorage()
})

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

  await page.clickAcceptButtonAndClosePopup()
  ;(await eventsP).forEach((ctx) => {
    expect(
      Object.keys((ctx.event.context as any).consent.categoryPreferences).length
    ).toBeGreaterThan(0)
  })
})

it('should send a consent changed event when user clicks accept on popup', async () => {
  await page.load()

  const { getConsentChangedCallCount } = await page.detectConsentChanged()

  await browser.pause(1000)
  await expect(getConsentChangedCallCount()).resolves.toBe(0)

  // make a consent selection in the OneTrust popup
  await page.clickAcceptButtonAndClosePopup()

  // 1 consent changed event should now be sent
  await browser.waitUntil(
    async () => (await getConsentChangedCallCount()) === 1
  )
})
