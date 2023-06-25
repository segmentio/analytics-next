/* eslint-disable @typescript-eslint/no-floating-promises */
import page from '../page-objects/onetrust'
import { expect } from 'expect'
import { Context } from '@segment/analytics-next'
it('should stamp each event', async () => {
  await page.load()

  const commands = [
    `analytics.track("hello world")`,
    `analytics.alias("foo", "bar")`,
    `analytics.page()`,
    `analytics.group("foo", { bar: 123 })`,
    `analytics.identify("bar", { bar: 123 })`,
  ]

  const r = Promise.all<Context>(commands.map((cmd) => browser.execute(cmd)))

  await page.clickAcceptButtonAndClosePopup()

  const responses = await r

  responses.forEach((ctx) => {
    expect(
      Object.keys((ctx.event.context as any).consent.categoryPreferences).length
    ).toBeGreaterThan(0)
  })
})
