import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'

const basicEdgeFn = `
    // this is a process signal function
    const processSignal = (signal) => {
      if (signal.type === 'interaction') {
        const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
        analytics.track(eventName, signal.data)
      }
  }`

let indexPage: IndexPage

const isoDateRegEx = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

test.beforeEach(async ({ page }) => {
  indexPage = await new IndexPage().loadAndWait(page, basicEdgeFn)
})

test('Signals should have anonymousId and timestamp at top level', async () => {
  await indexPage.network.mockTestRoute()
  await indexPage.network.makeFetchCall()
  await Promise.all([
    indexPage.clickButton(),
    indexPage.makeAnalyticsPageCall(),
    indexPage.waitForSignalsApiFlush(),
    indexPage.waitForTrackingApiFlush(),
  ])

  const types = [
    'network',
    'interaction',
    'instrumentation',
    'navigation',
  ] as const

  const evs = types.map((type) => ({
    type,
    networkCalls: indexPage.signalsAPI.getEvents(type),
  }))

  evs.forEach((events) => {
    if (!events.networkCalls.length) {
      throw new Error(`No events found for type ${events.type}`)
    }
    events.networkCalls.forEach((event) => {
      const expected = {
        anonymousId: event.anonymousId,
        timestamp: expect.stringMatching(isoDateRegEx),
        type: event.properties!.type,
      }
      expect(event.properties).toMatchObject(expected)
    })
  })
})
