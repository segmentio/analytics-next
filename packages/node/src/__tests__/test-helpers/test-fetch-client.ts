import { AnalyticsHTTPClient } from '../../lib/http-client'
import { createError, createSuccess } from './factories'

export type TestFetchClientOptions = {
  withError?: boolean
  /** override response (if needed) */
  response?: Response | Promise<Response>
}
/**
 * Test client.
 * Try not to use this directly -- use createTestAnalytics instead.
 */
export class TestFetchClient implements AnalyticsHTTPClient {
  private withError?: TestFetchClientOptions['withError']
  private response?: TestFetchClientOptions['response']
  constructor({ withError, response }: TestFetchClientOptions = {}) {
    this.withError = withError
    this.response = response
  }
  send(..._args: Parameters<AnalyticsHTTPClient['send']>) {
    if (this.response) {
      return Promise.resolve(this.response)
    }
    return Promise.resolve(this.withError ? createError() : createSuccess())
  }
}
