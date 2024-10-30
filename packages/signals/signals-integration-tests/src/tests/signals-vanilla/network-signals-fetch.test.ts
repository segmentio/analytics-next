import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'

const basicEdgeFn = `const processSignal = (signal) => {}`

test.describe('network signals - fetch', () => {
  let indexPage: IndexPage

  test.beforeEach(async ({ page }) => {
    indexPage = await new IndexPage().loadAndWait(page, basicEdgeFn)
  })

  test('should not emit non-json requests', async () => {
    await indexPage.network.mockTestRoute('http://localhost/upload', {
      body: JSON.stringify({ foo: 'test' }),
    })

    await indexPage.network.makeFileUploadRequest('http://localhost/upload')

    await indexPage.waitForSignalsApiFlush()

    const networkEvents = indexPage.signalsAPI.getEvents('network')

    // Check the request
    const requests = networkEvents.filter(
      (el) => el.properties!.data.action === 'request'
    )

    expect(requests).toHaveLength(0)
  })

  test('should try to parse the body of text/plain requests', async () => {
    await indexPage.network.mockTestRoute('http://localhost/test', {
      body: JSON.stringify({ foo: 'test' }),
      contentType: 'application/json',
    })

    await indexPage.network.makeFetchCall('http://localhost/test', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
      contentType: 'text/plain',
    })

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
  })

  test('should send the raw string if the request body cannot be parsed as json', async () => {
    await indexPage.network.mockTestRoute('http://localhost/test', {
      body: JSON.stringify({ foo: 'test' }),
      contentType: 'application/json',
    })

    await indexPage.network.makeFetchCall('http://localhost/test', {
      method: 'POST',
      body: 'hello world',
      contentType: 'text/plain',
    })

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
      data: 'hello world',
    })
  })

  test('can make a basic json request / not break regular fetch calls', async () => {
    await indexPage.network.mockTestRoute('http://localhost/test', {
      body: JSON.stringify({ foo: 'test' }),
    })

    const resBody = await indexPage.network.makeFetchCall(
      'http://localhost/test',
      {
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
        contentType: 'application/json',
      }
    )

    expect(resBody).toEqual({ foo: 'test' })

    await indexPage.waitForSignalsApiFlush()

    const networkEvents = indexPage.signalsAPI.getEvents('network')

    // Check the request
    const requests = networkEvents.filter(
      (el) => el.properties!.data.action === 'request'
    )
    expect(requests).toHaveLength(1)
    expect(requests[0].properties!.data).toEqual({
      action: 'request',
      contentType: 'application/json',
      url: 'http://localhost/test',
      method: 'POST',
      data: { key: 'value' },
    })

    const responses = networkEvents.filter(
      (el) => el.properties!.data.action === 'response'
    )
    expect(responses).toHaveLength(1)
    expect(responses[0].properties!.data).toEqual({
      action: 'response',
      contentType: 'application/json',
      url: 'http://localhost/test',
      data: { foo: 'test' },
      status: 200,
      ok: true,
    })
  })

  test('can handle relative url paths', async () => {
    await indexPage.network.mockTestRoute(`/test`, {
      body: JSON.stringify({ foo: 'test' }),
      contentType: 'application/json',
    })

    await indexPage.network.makeFetchCall('/test', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
      contentType: 'application/json',
    })

    await indexPage.waitForSignalsApiFlush()

    const networkEvents = indexPage.signalsAPI.getEvents('network')

    const requests = networkEvents.filter(
      (el) => el.properties!.data.action === 'request'
    )

    expect(requests).toHaveLength(1)
    expect(requests[0].properties!.data).toMatchObject({
      action: 'request',
      url: `${indexPage.origin()}/test`,
      data: { key: 'value' },
    })

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

  test.describe('errors', () => {
    test('will handle a json error response', async () => {
      await indexPage.network.mockTestRoute('http://localhost/test', {
        status: 400,
        body: JSON.stringify({ errorMsg: 'foo' }),
        contentType: 'application/json',
      })

      await indexPage.network.makeFetchCall('http://localhost/test', {
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
        contentType: 'application/json',
      })

      await indexPage.waitForSignalsApiFlush()

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
        status: 400,
        ok: false,
      })
      expect(responses).toHaveLength(1)
    })

    test('will handle a text error response', async () => {
      await indexPage.network.mockTestRoute('http://localhost/test', {
        status: 400,
        body: 'foo',
        contentType: 'text/plain',
      })

      await indexPage.network.makeFetchCall('http://localhost/test', {
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
        contentType: 'application/json',
      })

      await indexPage.waitForSignalsApiFlush()

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
        status: 400,
        ok: false,
      })
      expect(responses).toHaveLength(1)
    })
  })

  test('not emit response errors if there is no corresponding request, even if correct content type', async () => {
    await indexPage.network.mockTestRoute('http://localhost/test', {
      body: JSON.stringify({ foo: 'test' }),
      contentType: 'application/json',
      status: 400,
    })

    await indexPage.network.makeFileUploadRequest('http://localhost/test')

    await indexPage.waitForSignalsApiFlush()

    const networkEvents = indexPage.signalsAPI.getEvents('network')
    expect(networkEvents).toHaveLength(0)
  })
})
