import { FetchHTTPClient, HTTPFetchFn } from '..'
import { AbortSignal as AbortSignalShim } from '../lib/abort'
import { httpClientOptionsBodyMatcher } from './test-helpers/assert-shape/segment-http-api'
import { createTestAnalytics } from './test-helpers/create-test-analytics'
import { createSuccess } from './test-helpers/factories'

const testFetch: jest.MockedFn<HTTPFetchFn> = jest
  .fn()
  .mockResolvedValue(createSuccess())

let analytics: ReturnType<typeof createTestAnalytics>

const helpers = {
  makeTrackCall: () =>
    new Promise((resolve) =>
      analytics.track({ event: 'foo', userId: 'bar' }, resolve)
    ),
  assertFetchCallRequest: (
    ...[url, options]: NonNullable<typeof testFetch['mock']['lastCall']>
  ) => {
    expect(url).toBe('https://api.segment.io/v1/batch')
    expect(options.headers).toEqual({
      'Content-Type': 'application/json',
      'User-Agent': 'analytics-node-next/latest',
    })
    expect(options.method).toBe('POST')
    const getLastBatch = (): object[] => {
      const [, options] = testFetch.mock.lastCall!
      const batch = JSON.parse(options.body!).batch
      return batch
    }
    const batch = getLastBatch()
    expect(batch.length).toBe(1)
    expect(batch[0]).toEqual({
      ...httpClientOptionsBodyMatcher,
      timestamp: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      ),
      properties: {},
      event: 'foo',
      type: 'track',
      userId: 'bar',
    })
    // @ts-ignore
    expect(options.signal).toBeInstanceOf(
      typeof AbortSignal !== 'undefined' ? AbortSignal : AbortSignalShim
    )
  },
}

describe('httpClient option', () => {
  it('can be a regular custom HTTP client', async () => {
    analytics = createTestAnalytics({
      httpClient: new FetchHTTPClient(testFetch),
    })
    expect(testFetch).toHaveBeenCalledTimes(0)
    await helpers.makeTrackCall()
    expect(testFetch).toHaveBeenCalledTimes(1)
    helpers.assertFetchCallRequest(...testFetch.mock.lastCall!)
  })
  it('can be a simple function that matches the fetch interface', async () => {
    analytics = createTestAnalytics({ httpClient: testFetch })
    expect(testFetch).toHaveBeenCalledTimes(0)
    await helpers.makeTrackCall()
    expect(testFetch).toHaveBeenCalledTimes(1)
    helpers.assertFetchCallRequest(...testFetch.mock.lastCall!)
  })
})
