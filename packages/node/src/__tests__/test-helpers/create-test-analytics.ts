import { Analytics } from '../../app/analytics-node'
import { AnalyticsSettings } from '../../app/settings'
import { FetchHTTPClient, HTTPFetchFn } from '../../lib/http-client'
import { createError, createSuccess } from './factories'

export const createTestAnalytics = (
  settings: Partial<AnalyticsSettings> = {},
  {
    withError,
    useRealHTTPClient,
  }: TestFetchClientOptions & { useRealHTTPClient?: boolean } = {}
) => {
  return new Analytics({
    writeKey: 'foo',
    flushInterval: 100,
    ...(useRealHTTPClient
      ? {}
      : { httpClient: new TestFetchClient({ withError }) }),
    ...settings,
  })
}

export type TestFetchClientOptions = {
  withError?: boolean
  /** override response (if needed) */
  response?: Response | Promise<Response>
}

/**
 * Test http client. By default, it will return a successful response.
 */
export class TestFetchClient extends FetchHTTPClient {
  constructor({ withError, response }: TestFetchClientOptions = {}) {
    const _mockFetch: HTTPFetchFn = (..._args) => {
      if (response) {
        return Promise.resolve(response)
      }
      return Promise.resolve(withError ? createError() : createSuccess())
    }
    super(_mockFetch)
  }
}
