import { Analytics, InitOptions } from './analytics'
import { AnalyticsBrowser } from './browser'

type FunctionsOf<T> = {
  [k in keyof T]: T[k] extends Function ? T[k] : never
}

type AnalyticsMethods = Pick<Analytics, keyof FunctionsOf<Analytics>>

type StandaloneAnalytics = Analytics & {
  _loadOptions?: InitOptions
  _writeKey?: string
  _cdn?: string

  [Symbol.iterator](): Iterator<[keyof AnalyticsMethods, ...unknown[]]>
}

declare global {
  interface Window {
    analytics: StandaloneAnalytics
  }
}

function getWriteKey(): string | undefined {
  if (window.analytics._writeKey) {
    return window.analytics._writeKey
  }

  const regex = /http.*\/analytics\.js\/v1\/([^/]*)(\/platform)?\/analytics.*/
  const scripts = Array.from(document.querySelectorAll('script'))
  let writeKey: string | undefined = undefined

  for (const s of scripts) {
    const src = s.getAttribute('src') ?? ''
    const result = regex.exec(src)

    if (result && result[1]) {
      writeKey = result[1]
      break
    }
  }

  return writeKey
}

export function install(): Promise<void> {
  const writeKey = getWriteKey()
  if (!writeKey) {
    console.error(
      'Failed to load Write Key. Make sure to use the latest version of the Segment snippet, which can be found in your source settings.'
    )
    return Promise.resolve()
  }

  return AnalyticsBrowser.standalone(
    writeKey,
    window.analytics?._loadOptions ?? {}
  )
    .then((an) => {
      window.analytics = an as StandaloneAnalytics
    })
    .catch((err) => {
      console.error(err)
    })
}
