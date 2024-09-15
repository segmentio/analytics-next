import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'
import type { SegmentEvent } from '@segment/analytics-next'
import { promiseTimeout } from '@internal/test-helpers'

class NetworkPage extends IndexPage {}

const network = new NetworkPage()

const basicEdgeFn = `
    // this is a process signal function
    const processSignal = (signal) => {
      if (signal.type === 'interaction') {
        const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
        analytics.track(eventName, signal.data)
      }
  }`

test('network signals allow and disallow list', async ({ page }) => {
  await network.loadAndWait(page, basicEdgeFn, {
    networkSignalsAllowList: ['allowed-api.com'],
    networkSignalsDisallowList: ['disallowed-api.com'],
  })
  const ALLOWED_URL = 'https://allowed-api.com/api/bar'
  const DISALLOWED_URL = 'https://disallowed-api.com/api/foo'

  await network.mockTestRoute(ALLOWED_URL)
  await network.makeFetchCall(ALLOWED_URL)
  await network.waitForSignalsApiFlush()
  const batch = network.lastSignalsApiReq.postDataJSON().batch as SegmentEvent[]
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

  // Mock and make a fetch call to a disallowed URL
  await network.mockTestRoute(DISALLOWED_URL)
  await network.makeFetchCall(DISALLOWED_URL)
  await promiseTimeout(network.waitForSignalsApiFlush(), 2000)
    .then(() => {
      throw Error('should not flush, as there are no signals')
    })
    .catch((e) => {
      expect(e).toBeTruthy()
    })
})
