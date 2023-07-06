import { Analytics } from '../../app/analytics-node'
import { AnalyticsSettings } from '../../app/settings'
import { AnalyticsHTTPClientDELETE } from '../../lib/http-client'
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
export class TestFetchClient implements AnalyticsHTTPClientDELETE {
  private withError?: TestFetchClientOptions['withError']
  private response?: TestFetchClientOptions['response']
  constructor({ withError, response }: TestFetchClientOptions = {}) {
    this.withError = withError
    this.response = response
  }
  send(..._args: Parameters<AnalyticsHTTPClientDELETE['send']>) {
    if (this.response) {
      return Promise.resolve(this.response)
    }
    return Promise.resolve(this.withError ? createError() : createSuccess())
  }
}
