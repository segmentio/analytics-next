import { AnalyticsBrowser } from '@segment/analytics-next'
import {
  SignalsPlugin,
  ProcessSignal,
} from '@segment/analytics-browser-signals'

export const analytics = new AnalyticsBrowser()
if (!process.env.WRITEKEY) {
  throw new Error('No writekey provided.')
}

const processSignal: ProcessSignal = (signal, { analytics }) => {
  if (signal.type === 'interaction') {
    const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
    analytics.track(eventName, signal.data)
  }
}

const signalsPlugin = new SignalsPlugin({
  enableDebugLogging: true,
  processSignal: processSignal,
})

export const loadAnalytics = () =>
  analytics
    .load(
      { writeKey: process.env.WRITEKEY!, plugins: [signalsPlugin] },
      { initialPageview: true }
    )
    .then(() => {
      console.log(`Analytics loaded with WRITEKEY=${process.env.WRITEKEY}`)
      // @ts-ignore
      window.analytics = analytics // for debugging
    })
