import { Analytics } from '../../app/analytics-node'
import { AnalyticsSettings } from '../../app/settings'
import { TestFetchClient, TestFetchClientOptions } from './test-fetch-client'

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
