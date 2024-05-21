import { Analytics, AnalyticsSettings } from '../core/analytics'
import { cdnSettingsMinimal } from './fixtures'

export class TestAnalytics extends Analytics {
  constructor(settings: Partial<AnalyticsSettings> = {}, ...args: any[]) {
    super(
      { writeKey: 'test', cdnSettings: cdnSettingsMinimal, ...settings },
      ...args
    )
  }
}
