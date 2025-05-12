// This is a fully client-side implementation example, so this file will never be run in a node environment
// You only want to instantiate SignalsPlugin in a browser context, otherwise you'll get an error.

import { AnalyticsBrowser } from '@segment/analytics-next'
import {
  SignalsPlugin,
  SignalsPluginSettingsConfig,
  ProcessSignal,
} from '@segment/analytics-signals'

export const analytics = new AnalyticsBrowser()
if (!process.env.WRITEKEY) {
  throw new Error('No writekey provided.')
}

const processSignalExample: ProcessSignal = (
  signal,
  { analytics, signals }
) => {
  if (signal.type === 'interaction') {
    const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
    analytics.track(eventName, signal.data)
  } else if (signal.type === 'instrumentation') {
    const found = signals.find(
      signal,
      'interaction',
      (s) => s.data.eventType === 'change'
    )
    if (found) {
      console.log('found in the buffer!', found.data)
      analytics.track('found in the buffer!', found.data)
    }
  }
}

const getQueryParams = () => {
  const params = new URLSearchParams()
  const sandboxStrategy = params.get('sandboxStrategy')
  return {
    sandboxStrategy:
      sandboxStrategy as SignalsPluginSettingsConfig['sandboxStrategy'],
  }
}
const isStage = process.env.STAGE === 'true'

const queryParams = getQueryParams()
const signalsPlugin = new SignalsPlugin({
  ...(isStage ? { apiHost: 'signals.segment.build/v1' } : {}),
  sandboxStrategy: queryParams.sandboxStrategy ?? 'iframe',
  // processSignal: processSignalExample,
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
