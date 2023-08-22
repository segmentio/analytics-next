import type {
  AnalyticsSnippet,
  AnalyticsBrowser,
} from '@segment/analytics-next'
import { createWrapper, AnyAnalytics } from '../../index'

type Extends<T, U> = T extends U ? true : false

{
  const wrap = createWrapper({ getCategories: () => ({ foo: true }) })
  wrap({} as AnalyticsBrowser)
  wrap({} as AnalyticsSnippet)

  // see AnalyticsSnippet and AnalyticsBrowser extend AnyAnalytics
  const f: Extends<AnalyticsSnippet, AnyAnalytics> = true
  const g: Extends<AnalyticsBrowser, AnyAnalytics> = true
  console.log(f, g)
}
