import { CorePlugin, ValidationError } from '@segment/analytics-core'

export interface AnalyticsNodeSettings {
  /**
   * Key that corresponds to your Segment.io project
   */
  writeKey: string
  /**
   * An optional array of additional plugins that are capable of augmenting analytics-node functionality and enriching data.
   */
  plugins?: CorePlugin[]
  /**
   * The base URL of the API. Default: "https://api.segment.io"
   */
  host?: string
  /**
   * The API path route. Default: "/v1/batch"
   */
  path?: string
  /**
   * The number of times to try flushing a batch. Default: 4
   */
  maxAttempts?: number
  /**
   * The number of messages to enqueue before flushing. Default: 15
   */
  maxEventsInBatch?: number
  /**
   * The number of milliseconds to wait before flushing the queue automatically. Default: 1000
   */
  maxWaitTimeInMs?: number
}

export const validateSettings = (settings: AnalyticsNodeSettings) => {
  if (!settings.writeKey) {
    throw new ValidationError('writeKey', 'writeKey is missing.')
  }
}
