import { addFetchInterceptor, NetworkGenerator } from '../network'
import { SignalEmitter } from '../../emitter'
import { Response } from 'node-fetch'
import { sleep } from '@segment/analytics-core'

describe('addFetchInterceptor', () => {
  let origFetch: typeof window.fetch

  beforeEach(() => {
    origFetch = window.fetch
  })

  afterEach(() => {
    window.fetch = origFetch // Restore original fetch after each test
  })

  it('should intercept fetch requests and responses', async () => {
    const mockRequestHandler = jest.fn()
    const mockResponseHandler = jest.fn()
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
      headers: { 'Content-Type': 'application/json' },
    })

    window.fetch = jest.fn().mockResolvedValue(mockResponse)

    addFetchInterceptor(mockRequestHandler, mockResponseHandler)

    await window.fetch('http://example.com')

    expect(mockRequestHandler).toHaveBeenCalled()
    expect(mockResponseHandler).toHaveBeenCalled()
  })
})

describe('NetworkGenerator', () => {
  it('should register and emit signals on fetch requests and responses', async () => {
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
      headers: { 'content-type': 'application/json' },
      url: `http://${window.location.hostname}/test`,
    })
    window.fetch = jest.fn().mockResolvedValue(mockResponse)

    const mockEmitter = { emit: jest.fn() }
    const networkGenerator = new NetworkGenerator()
    const unregister = networkGenerator.register(
      mockEmitter as unknown as SignalEmitter
    )

    await window.fetch(`http://${window.location.hostname}/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    })

    await sleep(100)
    const [first, second] = mockEmitter.emit.mock.calls

    expect(first).toEqual([
      {
        type: 'network',
        data: {
          action: 'Request',
          url: `http://${window.location.hostname}/test`,
          method: 'POST',
          data: { key: 'value' },
        },
      },
    ])

    expect(second).toEqual([
      {
        type: 'network',
        data: {
          action: 'Response',
          url: `http://${window.location.hostname}/test`,
          data: { data: 'test' },
        },
      },
    ])

    unregister() // Clean up by unregistering the interceptor
  })
})
