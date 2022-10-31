import { CorePlugin, ValidationError } from '@segment/analytics-core'

export interface AnalyticsNodeSettings {
  writeKey: string
  timeout?: number
  plugins?: CorePlugin[]
  batchSettings?: {
    maxAttempts?: number
    maxEventsInBatch?: number
    maxWaitTimeInMs?: number
  }
}

export const validateSettings = (settings: AnalyticsNodeSettings) => {
  if (!settings.writeKey) {
    throw new ValidationError('writeKey', 'writeKey is missing.')
  }
}
