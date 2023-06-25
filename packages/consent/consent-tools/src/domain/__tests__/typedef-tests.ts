import type {
  AnalyticsSnippet,
  AnalyticsBrowser,
} from '@segment/analytics-next'
import { createWrapper } from '../../index'

{
  const wrap = createWrapper({ getCategories: () => ({ foo: true }) })
  wrap({} as AnalyticsBrowser)
  wrap({} as AnalyticsSnippet)
}
