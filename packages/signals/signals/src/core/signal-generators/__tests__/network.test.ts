import {
  addFetchInterceptor,
  matchHostname,
  NetworkGenerator,
} from '../network'
import { SignalEmitter } from '../../emitter'
import { Response } from 'node-fetch'
import { sleep } from '@segment/analytics-core'

const setLocation = (hostname: string) => {
  Object.defineProperty(window, 'location', {
    value: {
      ...window.location,
      hostname: hostname,
    },
    writable: true, // possibility to override
  })
}

describe('matchHostname', () => {
  beforeEach(() => {
    setLocation('example.com')
  })
  it('should not match external routes', () => {})

  it('should only match first party domains', () => {
    expect(matchHostname('https://www.example.com')).toBe(true)
    expect(matchHostname('https://www.example.com/api/foo')).toBe(true)
    expect(matchHostname('https://www.foo.com')).toBe(false)
    expect(
      matchHostname('https://cdn.segment.com/v1/projects/1234/versions/1')
    ).toBe(false)
  })

  it('should work with subdomains', () => {
    setLocation('api.example.com')
    expect(matchHostname('https://api.example.com/foo')).toBe(true)
    expect(matchHostname('https://foo.com/foo')).toBe(false)
  })

  it('should always allow relative domains', () => {
    expect(matchHostname('/foo/bar')).toBe(true)
  })
})

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
