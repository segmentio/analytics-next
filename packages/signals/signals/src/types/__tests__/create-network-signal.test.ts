import {
  createNetworkSignal,
  NetworkData,
  NetworkSignalMetadata,
} from '../signals'
import { normalizeUrl } from '../../lib/normalize-url'

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
      method: 'post',
      data: { key: 'value' },
    }

    const signal = createNetworkSignal(data, metadata)

    expect(signal).toEqual({
      type: 'network',
      data: {
        action: 'request',
        url: 'http://example.com',
        method: 'POST',
        data: { key: 'value' },
      },
      metadata,
    })
    expect(normalizeUrl).toHaveBeenCalledWith('http://example.com')
  })

  it('should create a network signal for a response', () => {
    const data: NetworkData = {
      action: 'response',
      url: 'http://example.com',
      data: { key: 'value' },
    }

    const signal = createNetworkSignal(data, metadata)

    expect(signal).toEqual({
      type: 'network',
      data: {
        action: 'response',
        url: 'http://example.com',
        data: { key: 'value' },
      },
      metadata,
    })
    expect(normalizeUrl).toHaveBeenCalledWith('http://example.com')
  })
})
