import page from '../page-objects/basic'
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

  const responses = await Promise.all<Context>(
    commands.map((cmd) => browser.execute(cmd))
  )

  responses.forEach((ctx) => {
    expect((ctx.event.context as any).consent).toEqual({
      categoryPreferences: {
        Advertising: true,
        Analytics: true,
      },
    })
  })
})
