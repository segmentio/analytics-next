import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'
import { SegmentEvent } from '@segment/analytics-next'

const basicEdgeFn = `
    // this is a process signal function
    const processSignal = (signal) => {
      if (signal.type === 'interaction') {
        const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
        analytics.track(eventName, signal.data)
      }
  }`

test.describe('XHR Tests', () => {
  let indexPage: IndexPage

  test.beforeEach(async ({ page }) => {
    indexPage = new IndexPage()
    await indexPage.loadAndWait(page, basicEdgeFn)
  })
  test('should not emit anything if neither request nor response are json', async () => {
    await indexPage.mockTestRoute('http://localhost/test', {
      body: 'hello',
      contentType: 'application/text',
    })

    await indexPage.makeXHRCall('http://localhost/test', {
      method: 'POST',
      body: 'hello world',
      contentType: 'application/text',
      responseType: 'text',
    })

    // Wait for the signals to be flushed
    await indexPage.waitForSignalsApiFlush()

    // Retrieve the batch of events from the signals request
    const batch = indexPage.lastSignalsApiReq.postDataJSON()
      .batch as SegmentEvent[]

    // Filter out network events
    const networkEvents = batch.filter(
      (el) => el.properties!.type === 'network'
    )

    // Ensure no request or response was captured
    expect(networkEvents).toHaveLength(0)
  })

  test('works with XHR', async () => {
    await indexPage.mockTestRoute('http://localhost/test', {
      body: JSON.stringify({ foo: 'test' }),
    })

    await indexPage.makeXHRCall('http://localhost/test', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
      contentType: 'application/json',
    })

    // Wait for the signals to be flushed
    await indexPage.waitForSignalsApiFlush()

    // Retrieve the batch of events from the signals request
    const batch = indexPage.lastSignalsApiReq.postDataJSON()
      .batch as SegmentEvent[]

    // Filter out network events
    const networkEvents = batch.filter(
      (el) => el.properties!.type === 'network'
    )

    // Check the request
    const requests = networkEvents.filter(
      (el) => el.properties!.data.action === 'request'
    )
    expect(requests).toHaveLength(1)
    expect(requests[0].properties!.data).toMatchObject({
      action: 'request',
      url: 'http://localhost/test',
      data: { key: 'value' },
    })

    // Check the response
    const responses = networkEvents.filter(
      (el) => el.properties!.data.action === 'response'
    )
    expect(responses).toHaveLength(1)
    expect(responses[0].properties!.data).toMatchObject({
      action: 'response',
      url: 'http://localhost/test',
      data: { foo: 'test' },
    })
  })

  test('should emit response but not request if request content-type is not json but response is', async () => {
    await indexPage.mockTestRoute('http://localhost/test', {
      body: JSON.stringify({ foo: 'test' }),
      contentType: 'application/json',
    })

    await indexPage.makeXHRCall('http://localhost/test', {
      method: 'POST',
      body: 'hello world',
      contentType: 'application/text',
    })

    // Wait for the signals to be flushed
    await indexPage.waitForSignalsApiFlush()

    // Retrieve the batch of events from the signals request
    const batch = indexPage.lastSignalsApiReq.postDataJSON()
      .batch as SegmentEvent[]

    // Filter out network events
    const networkEvents = batch.filter(
      (el) => el.properties!.type === 'network'
    )

    // Check the response (only response should be captured)
    const responses = networkEvents.filter(
      (el) => el.properties!.data.action === 'response'
    )
    expect(responses).toHaveLength(1)
    expect(responses[0].properties!.data).toMatchObject({
      action: 'response',
      url: 'http://localhost/test',
      data: { foo: 'test' },
    })

    // Ensure no request was captured
    const requests = networkEvents.filter(
      (el) => el.properties!.data.action === 'request'
    )
    expect(requests).toHaveLength(0)
  })

  test('should parse response if responseType is set to json but response header does not contain application/json', async () => {
    await indexPage.mockTestRoute('http://localhost/test', {
      body: '{"hello": "world"}',
    })

    await indexPage.makeXHRCall('http://localhost/test', {
      method: 'GET',
    })

    // Wait for the signals to be flushed
    await indexPage.waitForSignalsApiFlush()

    // Retrieve the batch of events from the signals request
    const batch = indexPage.lastSignalsApiReq.postDataJSON()
      .batch as SegmentEvent[]

    // Filter out network events
    const networkEvents = batch.filter(
      (el) => el.properties!.type === 'network'
    )

    // Check the response
    const responses = networkEvents.filter(
      (el) => el.properties!.data.action === 'response'
    )
    expect(responses).toHaveLength(1)
    expect(responses[0].properties!.data).toMatchObject({
      action: 'response',
      url: 'http://localhost/test',
      data: { hello: 'world' },
    })
  })

  test('will not emit response if error', async () => {
    await indexPage.mockTestRoute('http://localhost/test', {
      status: 400,
      body: JSON.stringify({ error: 'error' }),
    })

    await indexPage.makeXHRCall('http://localhost/test', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
      contentType: 'application/json',
    })

    // Wait for the signals to be flushed
    await indexPage.waitForSignalsApiFlush()

    // Retrieve the batch of events from the signals request
    const batch = indexPage.lastSignalsApiReq.postDataJSON()
      .batch as SegmentEvent[]

    // Filter out network events
    const networkEvents = batch.filter(
      (el) => el.properties!.type === 'network'
    )

    // Check the request
    const requests = networkEvents.filter(
      (el) => el.properties!.data.action === 'request'
    )
    expect(requests).toHaveLength(1)
    expect(requests[0].properties!.data).toMatchObject({
      action: 'request',
      url: 'http://localhost/test',
    })

    // Ensure no response was captured
    const responses = networkEvents.filter(
      (el) => el.properties!.data.action === 'response'
    )
    expect(responses).toHaveLength(0)
  })
})
