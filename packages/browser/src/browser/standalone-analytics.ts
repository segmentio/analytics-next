import { AnalyticsBrowser } from '.'
import { embeddedWriteKey } from '../lib/embedded-write-key'
import { AnalyticsSnippet } from './standalone-interface'
import {
  getGlobalAnalytics,
  setGlobalAnalytics,
} from '../lib/global-analytics-helper'
import { getTrustedScriptSrc } from '../lib/parse-cdn'

function getWriteKey(): string | undefined {
  if (embeddedWriteKey()) {
    return embeddedWriteKey()
  }

  const analytics = getGlobalAnalytics()
  if (analytics?._writeKey) {
    return analytics._writeKey
  }

  // SECOPS-25767: resolve the write key only from a trusted tag - the one that
  // actually loaded us (document.currentScript, snapshotted at boot so this
  // also works from polyfill onload / deferred contexts where currentScript is
  // null), or failing that a tag on a known public Segment CDN. Never from an
  // arbitrary <script> in the DOM: a sniffed write key could redirect a
  // customer's event stream to an attacker-owned workspace.
  const regex = /http.*\/analytics\.js\/v1\/([^/]*)(\/platform)?\/analytics.*/
  const src = getTrustedScriptSrc()
  if (src) {
    const result = regex.exec(src)
    if (result && result[1]) {
      return result[1]
    }
  }

  return undefined
}

export async function install(): Promise<void> {
  const writeKey = getWriteKey()
  const options = getGlobalAnalytics()?._loadOptions ?? {}
  if (!writeKey) {
    console.error(
      'Failed to load Write Key. Make sure to use the latest version of the Segment snippet, which can be found in your source settings.'
    )
    return
  }

  setGlobalAnalytics(
    (await AnalyticsBrowser.standalone(writeKey, options)) as AnalyticsSnippet
  )
}
