import { AnalyticsBrowser } from '@segment/analytics-next'

const analytics = new AnalyticsBrowser()

analytics.load(
  {
    writeKey: '<SOME_WRITE_KEY>',
  },
  { initialPageview: true }
)
;(window as any).analytics = analytics
