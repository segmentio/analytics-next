import { Analytics, InitOptions } from './index'

type StandaloneAnalytics = Analytics & {
  _loadOptions?: InitOptions
  _writeKey: string
}

declare global {
  interface Window {
    analytics: StandaloneAnalytics
  }
}

Analytics.standalone(window.analytics._writeKey, window.analytics._loadOptions ?? {})
  .then((analytics) => {
    window.analytics = analytics as StandaloneAnalytics
  })
  .catch((err) => {
    console.error(err)
  })
