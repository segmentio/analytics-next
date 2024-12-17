// This is a fully client-side implementation example, so this file will never be run in a node environment
// You only want to instantiate SignalsPlugin in a browser context, otherwise you'll get an error.

import { AnalyticsBrowser } from '@segment/analytics-next'
import { SignalsPlugin, ProcessSignal } from '@segment/analytics-signals'

// Function to get query string parameters

const STORAGE_TYPE: 'localStorage' | 'sessionStorage' = 'localStorage'

// Function to set localStorage from query string parameters

const queryParams = {
  STAGE_KEY_NAME: 'stage',
  WRITE_KEY_NAME: 'wk',
  RESET_KEY_NAME: 'reset',
}

const Storage = () => {
  const getQueryParams = () => {
    const params = new URLSearchParams(window.location.search)
    const stage = params.get(queryParams.STAGE_KEY_NAME)
    const writeKey = params.get(queryParams.WRITE_KEY_NAME)
    const reset = params.get(queryParams.RESET_KEY_NAME)
    return { stage, writeKey, reset }
  }

  const clearStorage = () => {
    window[STORAGE_TYPE].removeItem(queryParams.STAGE_KEY_NAME)
    window[STORAGE_TYPE].removeItem(queryParams.WRITE_KEY_NAME)
  }
  const setStorage = () => {
    const { stage, writeKey, reset } = getQueryParams()

    if (stage !== null) {
      window[STORAGE_TYPE].setItem(queryParams.STAGE_KEY_NAME, stage)
    }
    if (writeKey !== null) {
      window[STORAGE_TYPE].setItem(queryParams.WRITE_KEY_NAME, writeKey)
    }
    if (reset !== null) {
      clearStorage()
    }
  }

  setStorage()
  return {
    getStorage: () => {
      return {
        stage: window[STORAGE_TYPE].getItem(queryParams.STAGE_KEY_NAME),
        writeKey: window[STORAGE_TYPE].getItem(queryParams.WRITE_KEY_NAME),
      }
    },
  }
}

// Set localStorage from query string parameters
const storage = Storage()

// Retrieve values from localStorage or fall back to environment variables
const isStage =
  storage.getStorage().stage === 'true' || process.env.STAGE === 'true'
const writeKey = storage.getStorage().writeKey || process.env.WRITEKEY

console.log('Query params allowed:', JSON.stringify(Object.values(queryParams)))

if (!writeKey) {
  throw new Error(
    `No writekey provided. please add ?${queryParams.WRITE_KEY_NAME}=<writekey> to the URL`
  )
}

export const analytics = new AnalyticsBrowser()

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

const signalsPlugin = new SignalsPlugin({
  ...(isStage ? { apiHost: 'signals.segment.build/v1' } : {}),
  // enableDebugLogging: true,
  // processSignal: processSignalExample,
})

export const loadAnalytics = () =>
  analytics
    .load(
      {
        writeKey: writeKey,
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
      console.log(`Analytics loaded with WRITEKEY=${writeKey}`)
      // @ts-ignore
      window.analytics = analytics // for debugging
    })
