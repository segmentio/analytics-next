import { NetworkData } from '@segment/analytics-signals-runtime'
import { normalizeUrl } from '../../lib/normalize-url'
import { createNetworkSignal } from '../factories'

jest.mock('../../lib/normalize-url', () => ({
  normalizeUrl: jest.fn((url) => url),
}))

describe(createNetworkSignal, () => {
  it('should create a network signal for a request', () => {
    const body: NetworkData = {
      action: 'request',
      url: 'http://example.com',
      method: 'POST',
      body: { key: 'value' },
      contentType: 'application/json',
      requestId: '12345',
    }

    const signal = createNetworkSignal(body)

    expect(signal).toMatchInlineSnapshot(`
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
          "requestId": "12345",
          "url": "http://example.com",
        },
        "index": undefined,
        "timestamp": <ISO Timestamp>,
        "type": "network",
      }
    `)
    expect(normalizeUrl).toHaveBeenCalledWith('http://example.com')
  })

  it('should create a network signal for a response', () => {
    const body: NetworkData = {
      action: 'response',
      requestId: '12345',
      url: 'http://example.com',
      ok: true,
      status: 200,
      contentType: 'application/json',
      body: { key: 'value' },
    }

    const signal = createNetworkSignal(body)

    expect(signal).toMatchInlineSnapshot(`
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
            "key": "value",
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
          "requestId": "12345",
          "status": 200,
          "url": "http://example.com",
        },
        "index": undefined,
        "timestamp": <ISO Timestamp>,
        "type": "network",
      }
    `)
    expect(normalizeUrl).toHaveBeenCalledWith('http://example.com')
  })
})
