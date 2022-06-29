import { Analytics, InitOptions } from '../core/analytics'
import { AnalyticsBrowser } from '.'
import { embeddedWriteKey } from '../lib/embedded-write-key'
import { PreInitMethodCallBuffer } from '../core/buffer'
import {
  getSnippetWindowBuffer,
  transformSnippetCall,
} from '../core/buffer/snippet'

export type AnalyticsSnippet = Analytics & {
  _loadOptions?: InitOptions
  _writeKey?: string
  _cdn?: string
}

declare global {
  interface Window {
    analytics: AnalyticsSnippet
  }
}

function getWriteKey(): string | undefined {
  if (embeddedWriteKey()) {
    return embeddedWriteKey()
  }

  if (window.analytics._writeKey) {
    return window.analytics._writeKey
  }

  const regex = /http.*\/analytics\.js\/v1\/([^/]*)(\/platform)?\/analytics.*/
  const scripts = Array.prototype.slice.call(
    document.querySelectorAll('script')
  )
  let writeKey: string | undefined = undefined

  for (const s of scripts) {
    const src = s.getAttribute('src') ?? ''
    const result = regex.exec(src)

    if (result && result[1]) {
      writeKey = result[1]
      break
    }
  }

  if (!writeKey && document.currentScript) {
    const script = document.currentScript as HTMLScriptElement
    const src = script.src

    const result = regex.exec(src)

    if (result && result[1]) {
      writeKey = result[1]
    }
  }

  return writeKey
}

export async function install(): Promise<void> {
  const writeKey = getWriteKey()
  const options = window.analytics?._loadOptions ?? {}
  if (!writeKey) {
    console.error(
      'Failed to load Write Key. Make sure to use the latest version of the Segment snippet, which can be found in your source settings.'
    )
    return
  }

  // This part is trippy.
  // The goal is to get any existing buffered calls from `window.analytics` once
  // then never worry about the `window.analytics` buffer again.
  // This is accomplished by:
  //  - mapping all the buffered calls into a preInitBuffer
  //  - clearing the window.analytics array
  //  - redirecting all future window.analytics.push calls to preInitBuffer
  const preInitBuffer = new PreInitMethodCallBuffer()
  preInitBuffer.push(...getSnippetWindowBuffer())
  Array.isArray(window.analytics) &&
    window.analytics.splice(0, window.analytics.length)

  window.analytics.push = (args) => {
    preInitBuffer.push(transformSnippetCall(args as unknown as any))
  }

  window.analytics = await AnalyticsBrowser.standalone(
    writeKey,
    options,
    preInitBuffer
  )
}
