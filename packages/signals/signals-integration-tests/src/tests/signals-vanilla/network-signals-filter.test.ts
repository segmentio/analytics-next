import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'
import type { SegmentEvent } from '@segment/analytics-next'

const indexPage = new IndexPage()

const basicEdgeFn = `
    // this is a process signal function
    const processSignal = (signal) => {
      if (signal.type === 'interaction') {
        const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
        analytics.track(eventName, signal.data)
      }
  }`

test('network signals allow and disallow list', async ({ page }) => {
  await indexPage.loadAndWait(page, basicEdgeFn, {
    networkSignalsAllowList: ['allowed-api.com'],
    networkSignalsDisallowList: ['https://disallowed-api.com/api/foo'],
  })

  // test that the allowed signals were emitted + sent
  const ALLOWED_URL = 'https://allowed-api.com/api/bar'
  const emittedNetworkSignalsAllowed = indexPage.waitForSignalsEmit(
    (el) => el.type === 'network'
  )
  await indexPage.mockTestRoute(ALLOWED_URL)
  await indexPage.makeFetchCall(ALLOWED_URL)
  await emittedNetworkSignalsAllowed

  await indexPage.waitForSignalsApiFlush()
  const batch = indexPage.lastSignalsApiReq.postDataJSON()
    .batch as SegmentEvent[]
  const networkEvents = batch.filter(
    (el: SegmentEvent) => el.properties!.type === 'network'
  )
  const allowedRequestsAndResponses = networkEvents.filter(
    (el) => el.properties!.data.url === ALLOWED_URL
  )
  expect(allowedRequestsAndResponses).toHaveLength(2)
  const [request, response] = allowedRequestsAndResponses
  expect(request.properties!.data.data).toEqual({
    foo: 'bar',
  })
  expect(response.properties!.data.data).toEqual({
    someResponse: 'yep',
  })

  // test the disallowed signals were not emitted (using the emitter to test this)
  const DISALLOWED_URL = 'https://disallowed-api.com/api/foo'
  const emittedNetworkSignalsDisallowed = indexPage.waitForSignalsEmit(
    (el) => el.type === 'network',
    {
      failOnEmit: true,
    }
  )
  await indexPage.mockTestRoute(DISALLOWED_URL)
  await indexPage.makeFetchCall(DISALLOWED_URL)
  await emittedNetworkSignalsDisallowed
})
