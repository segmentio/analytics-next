import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'

const basicEdgeFn = `function processSignal(signal) {}`

test.describe('network signals - XHR', () => {
  let indexPage: IndexPage

  test.beforeEach(async ({ page }) => {
    indexPage = await new IndexPage().loadAndWait(page, basicEdgeFn)
  })

  test('basic json request / not break XHR', async () => {
    await indexPage.network.mockTestRoute('http://localhost/test', {
      body: JSON.stringify({ foo: 'test' }),
    })

    const data = await indexPage.network.makeXHRCall('http://localhost/test', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
      responseType: 'json',
      contentType: 'application/json',
    })

    expect(data).toEqual({ foo: 'test' })

    const networkEvents = await indexPage.signalsAPI.waitForEvents(2, 'network')

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

  test('handles relative URL paths', async () => {
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
    const networkEvents = await indexPage.signalsAPI.waitForEvents(2, 'network')

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

  test('should emit request content type, even if not json', async () => {
    await indexPage.network.mockTestRoute('http://localhost/test', {
      body: JSON.stringify({ foo: 'test' }),
      contentType: 'application/json',
    })

    await indexPage.network.makeXHRCall('http://localhost/test', {
      method: 'POST',
      body: 'hello world',
      responseType: 'json',
      contentType: 'text/plain',
    })

    // Wait for the signals to be flushed

    const networkEvents = await indexPage.signalsAPI.waitForEvents(1, 'network')

    // ensure request
    const requests = networkEvents.filter(
      (el) => el.properties!.data.action === 'request'
    )
    expect(requests).toHaveLength(1)
    expect(requests[0].properties!.data).toMatchObject({
      action: 'request',
      url: 'http://localhost/test',
      data: 'hello world',
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

  test('should parse response if responseType is set to json but response header does not contain application/json', async () => {
    await indexPage.network.mockTestRoute('http://localhost/test', {
      body: '{"hello": "world"}',
    })

    await indexPage.network.makeXHRCall('http://localhost/test', {
      responseType: 'json',
      method: 'GET',
    })

    // Wait for the signals to be flushed
    await indexPage.signalsAPI.waitForEvents(1, 'network')

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
        responseType: 'json',
        responseLatency: 300,
      }),
      indexPage.network.makeXHRCall(req2URL, {
        method: 'POST',
        body: JSON.stringify({ req2: 'value' }),
        responseType: 'json',
        contentType: 'application/json',
        responseLatency: 0,
      }),
    ])

    // Wait for the signals to be flushed
    const networkEvents = await indexPage.signalsAPI.waitForEvents(2, 'network')

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

  test.describe('errors', () => {
    test('will handle a json error response', async () => {
      await indexPage.network.mockTestRoute('http://localhost/test', {
        status: 400,
        body: JSON.stringify({ errorMsg: 'foo' }),
        contentType: 'application/json',
      })

      await indexPage.network.makeXHRCall('http://localhost/test', {
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
        responseType: 'json', // if responseType is JSON and the API returns a non-JSON response, the response will be an empty object
        contentType: 'application/json',
      })

      await indexPage.signalsAPI.waitForEvents(2, 'network')

      const networkEvents = indexPage.signalsAPI.getEvents('network')

      const requests = networkEvents.filter(
        (el) => el.properties!.data.action === 'request'
      )
      expect(requests).toHaveLength(1)
      expect(requests[0].properties!.data).toMatchObject({
        action: 'request',
        url: 'http://localhost/test',
      })

      const responses = networkEvents.filter(
        (el) => el.properties!.data.action === 'response'
      )
      expect(responses[0].properties!.data).toMatchObject({
        action: 'response',
        url: 'http://localhost/test',
        data: { errorMsg: 'foo' },
      })
      expect(responses).toHaveLength(1)
    })

    test('will handle a text error response', async () => {
      await indexPage.network.mockTestRoute('http://localhost/test', {
        status: 400,
        body: 'foo',
        contentType: 'text/plain',
      })

      await indexPage.network.makeXHRCall('http://localhost/test', {
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
        responseType: 'text', // if responseType is JSON and the API returns a non-JSON response, the response will be an empty object
        contentType: 'application/json',
      })

      await indexPage.signalsAPI.waitForEvents(2, 'network')

      const networkEvents = indexPage.signalsAPI.getEvents('network')

      const requests = networkEvents.filter(
        (el) => el.properties!.data.action === 'request'
      )
      expect(requests).toHaveLength(1)
      expect(requests[0].properties!.data).toMatchObject({
        action: 'request',
        url: 'http://localhost/test',
      })

      const responses = networkEvents.filter(
        (el) => el.properties!.data.action === 'response'
      )
      expect(responses[0].properties!.data).toMatchObject({
        action: 'response',
        url: 'http://localhost/test',
        data: 'foo',
      })
      expect(responses).toHaveLength(1)
    })

    test('will handle a json request and a text error response', async () => {
      /**
       * if the expected responseType is set to JSON and the error response is not JSON, the response will be an empty object
       * This is a limitation of the XHR API, and the consumer is supposed to use responseType=text instead (but in practice, doesn't always)
       **/
      await indexPage.network.mockTestRoute('http://localhost/test', {
        status: 400,
        body: 'I should not be parsable',
        contentType: 'text/plain',
      })

      await indexPage.network.makeXHRCall('http://localhost/test', {
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
        responseType: 'json',
        contentType: 'application/json',
      })
      await indexPage.signalsAPI.waitForEvents(2, 'network')

      const networkEvents = indexPage.signalsAPI.getEvents('network')

      const requests = networkEvents.filter(
        (el) => el.properties!.data.action === 'request'
      )
      expect(requests).toHaveLength(1)
      expect(requests[0].properties!.data).toMatchObject({
        action: 'request',
        url: 'http://localhost/test',
      })

      const responses = networkEvents.filter(
        (el) => el.properties!.data.action === 'response'
      )
      expect(responses[0].properties!.data).toMatchObject({
        action: 'response',
        url: 'http://localhost/test',
        data: null,
      })
      expect(responses).toHaveLength(1)
    })
  })
})
