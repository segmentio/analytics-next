import {
  NetworkData,
  NetworkSignalMetadata,
} from '@segment/analytics-signals-runtime'
import { normalizeUrl } from '../../lib/normalize-url'
import { createNetworkSignal } from '../factories'

jest.mock('../../lib/normalize-url', () => ({
  normalizeUrl: jest.fn((url) => url),
}))

describe(createNetworkSignal, () => {
  const metadata: NetworkSignalMetadata = {
    filters: {
      allowed: ['allowed1', 'allowed2'],
      disallowed: ['disallowed1', 'disallowed2'],
    },
  }

  it('should create a network signal for a request', () => {
    const data: NetworkData = {
      action: 'request',
      url: 'http://example.com',
      method: 'POST',
      data: { key: 'value' },
      contentType: 'application/json',
    }

    const signal = createNetworkSignal(data, metadata)

    expect(signal).toMatchInlineSnapshot(`
      {
        "data": {
          "action": "request",
          "contentType": "application/json",
          "data": {
            "key": "value",
          },
          "method": "POST",
          "url": "http://example.com",
        },
        "metadata": {
          "filters": {
            "allowed": [
              "allowed1",
              "allowed2",
            ],
            "disallowed": [
              "disallowed1",
              "disallowed2",
            ],
          },
        },
        "type": "network",
      }
    `)
    expect(normalizeUrl).toHaveBeenCalledWith('http://example.com')
  })

  it('should create a network signal for a response', () => {
    const data: NetworkData = {
      action: 'response',
      url: 'http://example.com',
      ok: true,
      status: 200,
      contentType: 'application/json',
      data: { key: 'value' },
    }

    const signal = createNetworkSignal(data, metadata)

    expect(signal).toMatchInlineSnapshot(`
      {
        "data": {
          "action": "response",
          "contentType": "application/json",
          "data": {
            "key": "value",
          },
          "ok": true,
          "status": 200,
          "url": "http://example.com",
        },
        "metadata": {
          "filters": {
            "allowed": [
              "allowed1",
              "allowed2",
            ],
            "disallowed": [
              "disallowed1",
              "disallowed2",
            ],
          },
        },
        "type": "network",
      }
    `)
    expect(normalizeUrl).toHaveBeenCalledWith('http://example.com')
  })
})
