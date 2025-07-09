import { NetworkGenerator } from '..'
import { SignalEmitter } from '../../../emitter'
import { Response } from 'node-fetch'
import { sleep } from '@internal/test-helpers'
import { setLocation } from '../../../../test-helpers/set-location'
import { NetworkSignal } from '@segment/analytics-signals-runtime'

// xhr tests are in integration tests
describe(NetworkGenerator, () => {
  class TestNetworkGenerator extends NetworkGenerator {}

  beforeEach(() => {
    setLocation({ hostname: 'localhost' })
    // @ts-ignore
    const mockFetch: typeof fetch = (input, init) => {
      return Promise.resolve(
        new Response(JSON.stringify({ data: 'test' }), {
          headers: { 'content-type': 'application/json' },
          url: input.toString(),
        })
      )
    }

    window.fetch = mockFetch
  })

  it('should emit response signal and request signal, regardless of content type', async () => {
    const mockEmitter = { emit: jest.fn() }
    const networkGenerator = new TestNetworkGenerator()
    const unregister = networkGenerator.register(
      mockEmitter as unknown as SignalEmitter
    )

    await window.fetch(`/api`, {
      method: 'POST',
      headers: { 'content-type': 'text/html' },
      body: 'hello world',
    })

    await sleep(100)
    expect(
      mockEmitter.emit.mock.calls.flatMap((call) =>
        call.map((s: NetworkSignal) => s.data.action)
      )
    ).toMatchInlineSnapshot(`
      [
        "request",
        "response",
      ]
    `)

    unregister()
  })

  it('should emit response signal and request signal if no content-type', async () => {
    const mockEmitter = { emit: jest.fn() }
    const networkGenerator = new TestNetworkGenerator()
    const unregister = networkGenerator.register(
      mockEmitter as unknown as SignalEmitter
    )

    await window.fetch(`/some-data?foo=123`, {
      method: 'GET',
    })

    await sleep(100)
    expect(
      mockEmitter.emit.mock.calls.flatMap((call) =>
        call.map((s: NetworkSignal) => s.data.action)
      )
    ).toMatchInlineSnapshot(`
      [
        "request",
        "response",
      ]
    `)

    unregister()
  })
  const networkSignalMatcher = {
    data: { requestId: expect.stringMatching(/.+/) },
  }
  it('should register and emit signals on fetch requests and responses if on same domain', async () => {
    const mockEmitter = { emit: jest.fn() }
    const networkGenerator = new TestNetworkGenerator()
    const unregister = networkGenerator.register(
      mockEmitter as unknown as SignalEmitter
    )

    await window.fetch(`http://${window.location.hostname}/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    })

    await sleep(100)
    expect(mockEmitter.emit.mock.calls.length).toBe(2)
    const [first, second] = mockEmitter.emit.mock.calls

    expect(first[0]).toMatchInlineSnapshot(
      networkSignalMatcher,
      `
      {
        "anonymousId": "",
        "context": {
          "library": {
            "name": "@segment/analytics-next",
            "version": "0.0.0",
          },
          "signalsRuntime": "",
        },
        "data": {
          "action": "request",
          "body": {
            "key": "value",
          },
          "contentType": "application/json",
          "method": "POST",
          "page": {
            "hash": "",
            "hostname": "localhost",
            "path": "/",
            "referrer": "",
            "search": "",
            "title": "",
            "url": "http://localhost/",
          },
          "requestId": StringMatching /\\.\\+/,
          "url": "http://localhost/test",
        },
        "index": undefined,
        "timestamp": <ISO Timestamp>,
        "type": "network",
      }
    `
    )

    expect(second[0]).toMatchInlineSnapshot(
      networkSignalMatcher,
      `
      {
        "anonymousId": "",
        "context": {
          "library": {
            "name": "@segment/analytics-next",
            "version": "0.0.0",
          },
          "signalsRuntime": "",
        },
        "data": {
          "action": "response",
          "body": {
            "data": "test",
          },
          "contentType": "application/json",
          "ok": true,
          "page": {
            "hash": "",
            "hostname": "localhost",
            "path": "/",
            "referrer": "",
            "search": "",
            "title": "",
            "url": "http://localhost/",
          },
          "requestId": StringMatching /\\.\\+/,
          "status": 200,
          "url": "http://localhost/test",
        },
        "index": undefined,
        "timestamp": <ISO Timestamp>,
        "type": "network",
      }
    `
    )

    unregister()
  })

  it('should default to GET method if no method is provided', async () => {
    const mockEmitter = { emit: jest.fn() }
    const networkGenerator = new TestNetworkGenerator()
    const unregister = networkGenerator.register(
      mockEmitter as unknown as SignalEmitter
    )

    await window.fetch(`/test`, {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    })

    await sleep(100)
    const [first] = mockEmitter.emit.mock.calls

    expect(first[0].data.method).toBe('GET')
    unregister()
  })
})
