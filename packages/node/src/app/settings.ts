import { ValidationError } from '@segment/analytics-core'

export interface AnalyticsSettings {
  /**
   * Key that corresponds to your Segment.io project
   */
  writeKey: string
  /**
  /**
   * The base URL of the API. Default: "https://api.segment.io"
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
  /**
   * Disable the analytics library. All calls will be a noop. Default: false.
   */
  disable?: boolean
}

export const validateSettings = (settings: AnalyticsSettings) => {
  if (!settings.writeKey) {
    throw new ValidationError('writeKey', 'writeKey is missing.')
  }
}
