import { Analytics } from '../../app/analytics-node'
import { AnalyticsSettings } from '../../app/settings'

export const createTestAnalytics = (
  settings: Partial<AnalyticsSettings> = {}
) => {
  return new Analytics({ writeKey: 'foo', flushInterval: 100, ...settings })
}
