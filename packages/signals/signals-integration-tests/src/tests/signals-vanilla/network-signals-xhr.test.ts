import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'

const basicEdgeFn = `const processSignal = (signal) => {}`

test.describe('XHR Tests', () => {
  let indexPage: IndexPage

  test.beforeEach(async ({ page }) => {
    indexPage = new IndexPage()
    await indexPage.loadAndWait(page, basicEdgeFn)
  })
  test('should not emit anything if neither request nor response are json', async () => {
    await indexPage.network.mockTestRoute('http://localhost/test', {
      body: 'hello',
      contentType: 'application/text',
    })

    await indexPage.network.makeXHRCall('http://localhost/test', {
      method: 'POST',
      body: 'hello world',
      contentType: 'application/text',
      responseType: 'text',
    })

    // Wait for the signals to be flushed
    await indexPage.waitForSignalsApiFlush()

    const networkEvents = indexPage.signalsAPI.getEvents('network')

    // Ensure no request or response was captured
    expect(networkEvents).toHaveLength(0)
  })

  test('works with XHR', async () => {
    await indexPage.network.mockTestRoute('http://localhost/test', {
      body: JSON.stringify({ foo: 'test' }),
    })

    await indexPage.network.makeXHRCall('http://localhost/test', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
      contentType: 'application/json',
    })

    // Wait for the signals to be flushed
    await indexPage.waitForSignalsApiFlush()

    const networkEvents = indexPage.signalsAPI.getEvents('network')

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

  test('works with XHR and relative paths', async () => {
    await indexPage.network.mockTestRoute(`/test`, {
      body: JSON.stringify({ foo: 'test' }),
      contentType: 'application/json',
    })

    await indexPage.network.makeXHRCall('/test', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
      responseType: 'json',
      contentType: 'application/json',
    })

    // Wait for the signals to be flushed
    await indexPage.waitForSignalsApiFlush()

    const networkEvents = indexPage.signalsAPI.getEvents('network')

    // Check the request
    const requests = networkEvents.filter(
      (el) => el.properties!.data.action === 'request'
    )

    expect(requests).toHaveLength(1)
    expect(requests[0].properties!.data).toMatchObject({
      action: 'request',
      url: `${indexPage.origin()}/test`,
      data: { key: 'value' },
    })

    // Check the response
    const responses = networkEvents.filter(
      (el) => el.properties!.data.action === 'response'
    )
    expect(responses).toHaveLength(1)
    expect(responses[0].properties!.data).toMatchObject({
      action: 'response',
      url: `${indexPage.origin()}/test`,
      data: { foo: 'test' },
    })
  })

  test('should emit response but not request if request content-type is not json but response is', async () => {
    await indexPage.network.mockTestRoute('http://localhost/test', {
      body: JSON.stringify({ foo: 'test' }),
      contentType: 'application/json',
    })

    await indexPage.network.makeXHRCall('http://localhost/test', {
      method: 'POST',
      body: 'hello world',
      contentType: 'application/text',
    })

    // Wait for the signals to be flushed
    await indexPage.waitForSignalsApiFlush()

    const networkEvents = indexPage.signalsAPI.getEvents('network')

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
    await indexPage.network.mockTestRoute('http://localhost/test', {
      body: '{"hello": "world"}',
    })

    await indexPage.network.makeXHRCall('http://localhost/test', {
      responseType: 'json',
      method: 'GET',
    })

    // Wait for the signals to be flushed
    await indexPage.waitForSignalsApiFlush()

    // Retrieve the batch of events from the signals request
    const networkEvents = indexPage.signalsAPI.getEvents('network')

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
    await indexPage.network.mockTestRoute('http://localhost/test', {
      status: 400,
      body: JSON.stringify({ error: 'error' }),
    })

    await indexPage.network.makeXHRCall('http://localhost/test', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
      contentType: 'application/json',
    })

    // Wait for the signals to be flushed
    await indexPage.waitForSignalsApiFlush()

    const networkEvents = indexPage.signalsAPI.getEvents('network')

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
  test('can handle multiple requests with variable latency', async () => {
    const req1URL = 'http://localhost/test/1'
    const req2URL = 'http://localhost/test/2'

    await Promise.all([
      indexPage.network.mockTestRoute(req1URL, {
        body: JSON.stringify({ res1: 'test' }),
      }),
      indexPage.network.mockTestRoute(req2URL, {
        body: JSON.stringify({ res2: 'test' }),
      }),
    ])

    await Promise.all([
      indexPage.network.makeXHRCall(req1URL, {
        method: 'POST',
        body: JSON.stringify({ req1: 'value' }),
        contentType: 'application/json',
        responseLatency: 300,
      }),
      indexPage.network.makeXHRCall(req2URL, {
        method: 'POST',
        body: JSON.stringify({ req2: 'value' }),
        contentType: 'application/json',
        responseLatency: 0,
      }),
    ])

    // Wait for the signals to be flushed
    await indexPage.waitForSignalsApiFlush()

    // Retrieve the batch of events from the signals request
    const networkEvents = indexPage.signalsAPI.getEvents('network')
    // Check the request
    const requests = networkEvents.filter(
      (el) => el.properties!.data.action === 'request'
    )
    expect(requests).toHaveLength(2)
    const request1 = requests.find((u) => u.properties!.data.url === req1URL)!
    expect(request1).toBeDefined()
    expect(request1.properties!.data).toMatchObject({
      action: 'request',
      url: req1URL,
      data: { req1: 'value' },
    })

    const request2 = requests.find((u) => u.properties!.data.url === req2URL)!
    expect(request2).toBeDefined()
    expect(request2.properties!.data).toMatchObject({
      action: 'request',
      url: req2URL,
      data: { req2: 'value' },
    })
  })
})
