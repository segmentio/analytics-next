import { AnalyticsBrowser } from '@segment/analytics-next'
import { SignalsPlugin } from '@segment/analytics-browser-signals'

export const analytics = new AnalyticsBrowser()
if (!process.env.WRITEKEY) {
  throw new Error('No writekey provided.')
}
const signal = `
 function processSignal(signal) {
    if (signal.type === 'interaction') {
      const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
      analytics.track(eventName, signal.data)
    }
  }
  `
const signalsPlugin = new SignalsPlugin({
  enableDebugLogging: true,
  edgeFnOverride: signal,
})

void analytics
  .load({ writeKey: process.env.WRITEKEY!, plugins: [signalsPlugin] })
  .then(() =>
    console.log(`Analytics loaded with WRITEKEY=${process.env.WRITEKEY}`)
  )
