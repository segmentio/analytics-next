import {
  NetworkGenerator,
  NetworkSettingsConfig,
  NetworkSettingsConfigSettings,
} from '..'
import { SignalEmitter } from '../../../emitter'
import { Response } from 'node-fetch'
import { sleep } from '@internal/test-helpers'
import { setLocation } from '../../../../test-helpers/set-location'

// xhr tests are in integration tests
describe(NetworkGenerator, () => {
  class TestNetworkGenerator extends NetworkGenerator {
    constructor(settings: Partial<NetworkSettingsConfigSettings> = {}) {
      super(new NetworkSettingsConfig(settings))
    }
  }

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

  it('should respect the allow/disallow list', async () => {
    const mockEmitter = { emit: jest.fn() }
    const networkGenerator = new TestNetworkGenerator({
      networkSignalsAllowList: [
        new RegExp(`allowed.com/api/v1`),
        'foo.com/api/v2',
      ],
      networkSignalsDisallowList: [new RegExp(`allowed.com/api/v666`)],
    })
    const unregister = networkGenerator.register(
      mockEmitter as unknown as SignalEmitter
    )

    // allowed
    await window.fetch(`http://allowed.com/api/v1/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    })

    await sleep(50)
    expect(mockEmitter.emit.mock.calls.length).toBe(2)
    const allowedCalls = mockEmitter.emit.mock.calls
    const [first, second] = allowedCalls

    expect(first[0].data).toMatchObject({
      action: 'request',
      url: 'http://allowed.com/api/v1/test',
    })

    expect(second[0].data).toMatchObject({
      action: 'response',
      url: 'http://allowed.com/api/v1/test',
    })

    // not allowed
    await window.fetch(`http://allowed.com/api/v666`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    })
    await sleep(50)
    // expect no call
    expect(mockEmitter.emit.mock.calls.length).toBe(2)

    unregister() // Clean up by unregistering the interceptor
  })

  it('should not emit request or response signals if not on the same domain', async () => {
    const mockEmitter = { emit: jest.fn() }
    const networkGenerator = new TestNetworkGenerator()
    const unregister = networkGenerator.register(
      mockEmitter as unknown as SignalEmitter
    )

    await window.fetch(`https://foo.com`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    })

    await sleep(100)
    expect(mockEmitter.emit.mock.calls).toEqual([])
    unregister()
  })

  it('should not emit request or response signals if content-type is not recognized in request/response', async () => {
    // @ts-ignore
    const mockFetch: typeof fetch = (input, init) => {
      return Promise.resolve(
        new Response(JSON.stringify({ data: 'test' }), {
          headers: { 'content-type': 'foo/bar' },
          url: input.toString(),
        })
      )
    }
    window.fetch = mockFetch

    const mockEmitter = { emit: jest.fn() }
    const networkGenerator = new TestNetworkGenerator()
    const unregister = networkGenerator.register(
      mockEmitter as unknown as SignalEmitter
    )

    await window.fetch(`https://foo.com`, {
      method: 'POST',
      headers: { 'content-type': 'bar/baz' },
      body: JSON.stringify({ key: 'value' }),
    })

    await sleep(100)
    expect(mockEmitter.emit.mock.calls).toEqual([])
    unregister()
  })

  it('should emit response signal but not request signal if content-type for request is not recognized  ', async () => {
    const mockEmitter = { emit: jest.fn() }
    const networkGenerator = new TestNetworkGenerator()
    const unregister = networkGenerator.register(
      mockEmitter as unknown as SignalEmitter
    )

    await window.fetch(`/api`, {
      method: 'GET',
      headers: { 'content-type': 'text/html' },
      body: 'hello world',
    })

    await sleep(100)
    expect(mockEmitter.emit.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "data": {
              "action": "response",
              "data": {
                "data": "test",
              },
              "url": "http://localhost/api",
            },
            "metadata": {
              "filters": {
                "allowed": [],
                "disallowed": [],
              },
            },
            "type": "network",
          },
        ],
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
          "data": {
            "data": "test",
          },
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

  it('should handle relative domains', async () => {
    const mockEmitter = { emit: jest.fn() }
    const networkGenerator = new TestNetworkGenerator()
    const unregister = networkGenerator.register(
      mockEmitter as unknown as SignalEmitter
    )

    await window.fetch(`/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    })

    await sleep(100)
    const [first] = mockEmitter.emit.mock.calls

    expect(first[0].data.url).toBe('http://localhost/test')
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

  it('emits signals for same domain if networkSignalsAllowSameDomain = false', async () => {
    const mockEmitter = { emit: jest.fn() }
    const networkGenerator = new TestNetworkGenerator({
      networkSignalsAllowList: ['foo.com'],
      networkSignalsDisallowList: [],
      networkSignalsAllowSameDomain: false,
    })
    const unregister = networkGenerator.register(
      mockEmitter as unknown as SignalEmitter
    )

    await window.fetch(`http://${window.location.hostname}/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    })

    await sleep(100)
    expect(mockEmitter.emit.mock.calls.length).toBe(0)

    await window.fetch(`http://foo.com/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    })

    await sleep(100)
    expect(mockEmitter.emit.mock.calls.length).toBe(2)

    unregister()
  })

  it('disallows the signal if it matches in both the allow and disallow list', async () => {
    const mockEmitter = { emit: jest.fn() }
    const networkGenerator = new TestNetworkGenerator({
      networkSignalsAllowList: ['disallowed-api.com'],
      networkSignalsDisallowList: ['https://disallowed-api.com'],
    })
    const unregister = networkGenerator.register(
      mockEmitter as unknown as SignalEmitter
    )

    await window.fetch(`https://disallowed-api.com/api/foo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    })

    await sleep(100)
    expect(mockEmitter.emit.mock.calls).toEqual([])
    unregister()
  })
})
