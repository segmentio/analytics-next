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
const isStage = process.env.STAGE === 'true'

const signalsPlugin = new SignalsPlugin({
  ...(isStage ? { apiHost: 'api.signals.build/v1' } : {}),
  enableDebugLogging: true,
  processSignal: processSignal,
})

export const loadAnalytics = () =>
  analytics
    .load(
      {
        writeKey: process.env.WRITEKEY!,
        plugins: [signalsPlugin],
        ...(isStage ? { cdnURL: 'https://cdn.segment.build' } : {}),
      },
      {
        initialPageview: true,
        ...(isStage
          ? {
              integrations: {
                'Segment.io': {
                  apiHost: 'api.segment.build/v1',
                },
              },
            }
          : {}),
      }
    )
    .then(() => {
      console.log(`Analytics loaded with WRITEKEY=${process.env.WRITEKEY}`)
      // @ts-ignore
      window.analytics = analytics // for debugging
    })
