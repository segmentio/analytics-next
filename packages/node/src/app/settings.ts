import { CorePlugin, ValidationError } from '@segment/analytics-core'

export interface AnalyticsNodeSettings {
  writeKey: string
  timeout?: number
  plugins?: CorePlugin[]
  /** Number of ms to wait for the queue to be empty before emitting a 'drained' event */
  drainedDelay?: number
}

export const validateSettings = (settings: AnalyticsNodeSettings) => {
  if (!settings.writeKey) {
    throw new ValidationError('writeKey', 'writeKey is missing.')
  }
}
