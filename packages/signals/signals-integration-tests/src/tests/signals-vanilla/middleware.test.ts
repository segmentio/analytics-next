import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'

const basicEdgeFn = `globalThis.processSignal = (signal) => {}`

let indexPage: IndexPage

test('middleware', async ({ page }) => {
  indexPage = await new IndexPage().load(
    page,
    basicEdgeFn,
    {},
    {
      skipSignalsPluginInit: true,
    }
  )

  await page.evaluate(
    ({ settings }) => {
      window.signalsPlugin = new window.SignalsPlugin({
        middleware: [
          {
            load() {
              return undefined
            },
            process: function (signal) {
              // @ts-ignore
              signal.data['middleware'] = 'test'
              return signal
            },
          },
        ],
        ...settings,
      })
      window.analytics.load({
        writeKey: '<SOME_WRITE_KEY>',
        plugins: [window.signalsPlugin],
      })
    },
    {
      settings: {
        ...indexPage.defaultSignalsPluginTestSettings,
        flushAt: 1,
      },
    }
  )

  /**
   * Make an analytics.page() call, see that the middleware can modify the event
   */
  await Promise.all([
    indexPage.makeAnalyticsPageCall(),
    indexPage.waitForSignalsApiFlush(),
  ])

  const instrumentationEvents =
    indexPage.signalsAPI.getEvents('instrumentation')
  expect(instrumentationEvents).toHaveLength(1)
  const ev = instrumentationEvents[0]
  expect(ev.properties!.data['middleware']).toEqual('test')
})
