import {
  resolveAliasArguments,
  resolveArguments,
  resolvePageArguments,
  resolveUserArguments,
} from '@segment/analytics-next'
import { logger } from '../../lib/logger'
import createWorkerBox from 'workerboxjs'

import { AnalyticsRuntimePublicApi, Signal } from '../../types'
import { createSignalsRuntime } from './signals-runtime'
import { replaceBaseUrl } from '../../lib/replace-base-url'

export type MethodName =
  | 'page'
  | 'identify'
  | 'track'
  | 'alias'
  | 'screen'
  | 'group'

/**
 * Buffer of any analytics calls made during the processing of a signal
 */
export type AnalyticsMethodCalls = Record<MethodName, any[]>

/**
 * Proxy around the analytics client
 */
class AnalyticsRuntime implements AnalyticsRuntimePublicApi {
  private calls: AnalyticsMethodCalls = {
    page: [],
    identify: [],
    track: [],
    alias: [],
    screen: [],
    group: [],
  }

  getCalls(): AnalyticsMethodCalls {
    return this.calls
  }

  /**
   * Stamp the context with the event origin to prevent infinite signal-event loops.
   */
  stamp(options: Record<string, any>): Record<string, any> {
    if (!options) {
      options = {}
    }
    options.context = { ...options.context, __eventOrigin: { type: 'Signal' } }
    return options
  }

  // these methods need to be bound to the instance, rather than the prototype, in order to serialize correctly in the sandbox.
  track = (...args: any[]) => {
    // @ts-ignore
    const [eventName, props, options, cb] = resolveArguments(...args)

    this.calls.track.push([eventName, props, this.stamp(options), cb])
  }

  identify = (...args: any[]) => {
    // @ts-ignore
    const [id, traits, options, cb] = resolveUserArguments(...args)
    this.stamp(options)
    this.calls.identify.push([id, traits, this.stamp(options), cb])
  }
  alias = (...args: any[]) => {
    const [userId, previousId, options, cb] = resolveAliasArguments(
      // @ts-ignore
      ...args
    )
    this.calls.alias.push([userId, previousId, this.stamp(options), cb])
  }
  group = (...args: any[]) => {
    // @ts-ignore
    const [id, traits, options, cb] = resolveUserArguments(...args)
    this.calls.group.push([id, traits, this.stamp(options), cb])
  }
  page = (...args: any[]) => {
    const [category, name, props, options, cb] = resolvePageArguments(...args)
    this.stamp(options)
    this.calls.page.push([category, name, props, this.stamp(options), cb])
  }

  screen = (...args: any[]) => {
    const [category, name, props, options, cb] = resolvePageArguments(...args)
    this.stamp(options)
    this.calls.screen.push([category, name, props, this.stamp(options), cb])
  }
}

interface CodeSandbox {
  run: (fn: string, scope: Record<string, any>) => Promise<any>
  destroy: () => Promise<void>
}

class JavascriptSandbox implements CodeSandbox {
  private workerbox: Promise<CodeSandbox>
  constructor() {
    this.workerbox = createWorkerBox('')
  }
  async run(fn: string, scope: Record<string, any>) {
    try {
      const wb = await this.workerbox
      await wb.run(fn, scope)
    } catch (err) {
      console.error('processSignal() error in sandbox', err, {
        fn,
      })
    }
  }

  async destroy(): Promise<void> {
    const wb = await this.workerbox
    await wb.destroy()
  }
}

export type SandboxSettingsConfig = {
  functionHost: string | undefined
  processSignal: string | undefined
  edgeFnDownloadURL: string | undefined
  edgeFnFetchClient?: typeof fetch
}

export class SandboxSettings {
  /**
   * Should look like:
   * ```js
   * function processSignal(signal) {
   * ...
   * }
   * ```
   */
  processSignal: Promise<string>
  constructor(settings: SandboxSettingsConfig) {
    const edgeFnDownloadURLNormalized =
      settings.functionHost && settings.edgeFnDownloadURL
        ? replaceBaseUrl(
            settings.edgeFnDownloadURL,
            `https://${settings.functionHost}`
          )
        : settings.edgeFnDownloadURL

    if (!edgeFnDownloadURLNormalized && !settings.processSignal) {
      throw new Error('edgeFnDownloadURL or processSignal must be defined')
    }

    const fetch = settings.edgeFnFetchClient ?? globalThis.fetch

    const processSignalNormalized = settings.processSignal
      ? Promise.resolve(settings.processSignal).then(
          (str) => `globalThis.processSignal = ${str}`
        )
      : fetch(edgeFnDownloadURLNormalized!).then((res) => res.text())

    this.processSignal = processSignalNormalized
  }
}

export class Sandbox {
  settings: SandboxSettings
  jsSandbox: CodeSandbox

  constructor(settings: SandboxSettings) {
    this.settings = settings
    this.jsSandbox = new JavascriptSandbox()
  }

  async process(
    signal: Signal,
    signals: Signal[]
  ): Promise<AnalyticsMethodCalls> {
    const analytics = new AnalyticsRuntime()
    const scope = {
      analytics,
    }
    logger.debug('processing signal', { signal, scope, signals })
    const code = [
      await this.settings.processSignal,
      `const createSignalsRuntime = ${createSignalsRuntime.toString()}`,
      `const signals = createSignalsRuntime(${JSON.stringify(signals)})`,
      'try { processSignal(' +
        JSON.stringify(signal) +
        ', { analytics, signals }); } catch(err) { console.error("Process signal failed.", err); }',
    ].join('\n')
    await this.jsSandbox.run(code, scope)

    const calls = analytics.getCalls()
    logger.debug('analytics calls', calls)
    return calls
  }
}
