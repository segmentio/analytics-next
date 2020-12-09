import { Analytics, InitOptions } from './analytics'
import { AnalyticsBrowser } from './browser'

type FunctionsOf<T> = {
  [k in keyof T]: T[k] extends Function ? T[k] : never
}

type AnalyticsMethods = Pick<Analytics, keyof FunctionsOf<Analytics>>

type StandaloneAnalytics = Analytics & {
  _loadOptions?: InitOptions
  _writeKey?: string

  [Symbol.iterator](): Iterator<[keyof AnalyticsMethods, ...unknown[]]>
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

export async function install(): Promise<void> {
  const writeKey = getWriteKey()
  if (!writeKey) {
    console.error('Failed to load Write Key')
    return
  }

  return AnalyticsBrowser.standalone(writeKey, window.analytics?._loadOptions ?? {})
    .then((analytics) => {
      // @ts-expect-error
      const buffered = window.analytics && window.analytics[0] ? [...window.analytics] : []

      window.analytics = analytics as StandaloneAnalytics

      for (const [operation, ...args] of buffered) {
        // @ts-expect-error
        if (window.analytics[operation] && typeof window.analytics[operation] === 'function') {
          // @ts-expect-error
          window.analytics[operation].call(window.analytics, ...args)
        }
      }
    })
    .catch((err) => {
      console.error(err)
    })
}
