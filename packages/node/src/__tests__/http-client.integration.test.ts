import { HTTPFetchFn } from '..'
import { AbortSignal as AbortSignalShim } from '../lib/abort'
import { httpClientOptionsBodyMatcher } from './test-helpers/assert-shape/segment-http-api'
import { createTestAnalytics } from './test-helpers/create-test-analytics'
import { createSuccess } from './test-helpers/factories'
const testFetch: jest.MockedFn<HTTPFetchFn> = jest
  .fn()
  .mockResolvedValue(createSuccess())

const assertFetchCallRequest = (
  ...[url, options]: typeof testFetch['mock']['lastCall']
) => {
  expect(url).toBe('https://api.segment.io/v1/batch')
  expect(options.headers).toEqual({
    Authorization: 'Basic Zm9vOg==',
    'Content-Type': 'application/json',
    'User-Agent': 'analytics-node-next/latest',
  })
  expect(options.method).toBe('POST')

  // @ts-ignore
  if (typeof AbortSignal !== 'undefined') {
    // @ts-ignore
    expect(options.signal).toBeInstanceOf(AbortSignal)
  } else {
    expect(options.signal).toBeInstanceOf(AbortSignalShim)
  }
}
const getLastBatch = (): any[] => {
  const [, options] = testFetch.mock.lastCall
  const batch = JSON.parse(options.body!).batch
  return batch
}

describe('HTTP Client', () => {
  it('should accept a custom fetch function', async () => {
    const analytics = createTestAnalytics({ httpClient: testFetch })
    expect(testFetch).toHaveBeenCalledTimes(0)
    await new Promise((resolve) =>
      analytics.track({ event: 'foo', userId: 'bar' }, resolve)
    )
    expect(testFetch).toHaveBeenCalledTimes(1)
    assertFetchCallRequest(...testFetch.mock.lastCall)
    const batch = getLastBatch()
    expect(batch.length).toBe(1)
    expect(batch[0]).toEqual({
      ...httpClientOptionsBodyMatcher,
      timestamp: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      ),
      properties: {},
      type: 'track',
      userId: 'bar',
      event: 'foo',
    })
  })
})
