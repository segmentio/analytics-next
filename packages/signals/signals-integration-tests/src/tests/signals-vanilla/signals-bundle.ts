import { AnalyticsBrowser } from '@segment/analytics-next'
import { SignalsPlugin } from '@segment/analytics-browser-signals'

const analytics = new AnalyticsBrowser()
;(window as any).analytics = analytics

const signalsPlugin = new SignalsPlugin()

analytics.load({
  writeKey: '<SOME_WRITE_KEY>',
  plugins: [signalsPlugin],
})
