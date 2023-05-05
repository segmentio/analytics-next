import { ValidationError } from '@customerio/cdp-analytics-core'

export interface AnalyticsSettings {
  /**
   * Key for your workspace
   */
  writeKey: string
  /**
  /**
   * The base URL of the API. Default: "https://cdp.customer.io"
   */
  host?: string
  /**
   * The API path route. Default: "/v1/batch"
   */
  path?: string
  /**
   * The number of times to retry flushing a batch. Default: 3
   */
  maxRetries?: number
  /**
   * The number of messages to enqueue before flushing. Default: 15
   */
  maxEventsInBatch?: number
  /**
   * The number of milliseconds to wait before flushing the queue automatically. Default: 10000
   */
  flushInterval?: number
  /**
   * The maximum number of milliseconds to wait for an http request. Default: 10000
   */
  httpRequestTimeout?: number
}

export const validateSettings = (settings: AnalyticsSettings) => {
  if (!settings.writeKey) {
    throw new ValidationError('writeKey', 'writeKey is missing.')
  }
}
