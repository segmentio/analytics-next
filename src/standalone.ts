import { Analytics, InitOptions } from './analytics'
import { AnalyticsBrowser } from './browser'

type StandaloneAnalytics = Analytics & {
  _loadOptions?: InitOptions
  _writeKey?: string
}

declare global {
  interface Window {
    analytics: StandaloneAnalytics
  }
}

function getWriteKey(): string | undefined {
  const regex = /.*\/analytics\.js\/v1\/([^/]*)(\/platform)?\/analytics.*/
  const scripts = Array.from(document.querySelectorAll('script'))
  let writeKey: string | undefined = undefined

  scripts.forEach((s) => {
    const src = s.getAttribute('src') ?? ''
    const result = regex.exec(src)

    if (result && result[1]) {
      writeKey = result[1]
    }
  })

  return writeKey ?? window.analytics._writeKey
}

const writeKey = getWriteKey()
if (!writeKey) {
  console.error('Failed to load Write Key')
}

if (writeKey) {
  AnalyticsBrowser.standalone(writeKey, window.analytics._loadOptions ?? {})
    .then((analytics) => {
      window.analytics = analytics as StandaloneAnalytics
    })
    .catch((err) => {
      console.error(err)
    })
}
