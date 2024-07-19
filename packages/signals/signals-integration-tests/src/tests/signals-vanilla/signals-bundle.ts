import { AnalyticsBrowser } from '@segment/analytics-next'
import { SignalsPlugin } from '@segment/analytics-signals'

const analytics = new AnalyticsBrowser()
;(window as any).analytics = analytics

const signalsPlugin = new SignalsPlugin({
  disableSignalsRedaction: true,
})

;(window as any).signalsPlugin = signalsPlugin

analytics.load({
  writeKey: '<SOME_WRITE_KEY>',
  plugins: [signalsPlugin],
})
