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

    expect(first[0]).toMatchInlineSnapshot(`
      {
        "data": {
          "action": "request",
          "contentType": "application/json",
          "data": {
            "key": "value",
          },
          "method": "POST",
          "url": "http://localhost/test",
        },
        "metadata": {
          "filters": {
            "allowed": [],
            "disallowed": [],
          },
        },
        "type": "network",
      }
    `)

    expect(second[0]).toMatchInlineSnapshot(`
      {
        "data": {
          "action": "response",
          "contentType": "application/json",
          "data": {
            "data": "test",
          },
          "ok": true,
          "status": 200,
          "url": "http://localhost/test",
        },
        "metadata": {
          "filters": {
            "allowed": [],
            "disallowed": [],
          },
        },
        "type": "network",
      }
    `)

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
