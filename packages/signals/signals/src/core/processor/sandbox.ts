import { logger } from '../../lib/logger'
import createWorkerBox from 'workerboxjs'
import { resolvers } from './arg-resolvers'
import { AnalyticsRuntimePublicApi, Signal, AnalyticsEnums } from '../../types'
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
  private stamp(options: Record<string, any>): Record<string, any> {
    if (!options) {
      options = {}
    }
    options.context = { ...options.context, __eventOrigin: { type: 'Signal' } }
    return options
  }

  // these methods need to be bound to the instance, rather than the prototype, in order to serialize correctly in the sandbox.
  track = (...args: any[]) => {
    try {
      // @ts-ignore
      const [eventName, props, options, cb] = resolvers.resolveArguments(
        // @ts-ignore
        ...args
      )
      this.calls.track.push([eventName, props, this.stamp(options), cb])
    } catch (err) {
      // wrapping all methods in a try/catch because throwing an error won't cause the error to surface inside of workerboxjs
      console.error(err)
    }
  }

  identify = (...args: any[]) => {
    try {
      // @ts-ignore
      const [id, traits, options, cb] = resolvers.resolveUserArguments(...args)
      this.calls.identify.push([id, traits, this.stamp(options), cb])
    } catch (err) {
      console.error(err)
    }
  }

  alias = (...args: any[]) => {
    try {
      const [userId, previousId, options, cb] = resolvers.resolveAliasArguments(
        // @ts-ignore
        ...args
      )
      this.calls.alias.push([userId, previousId, this.stamp(options), cb])
    } catch (err) {
      console.error(err)
    }
  }
  group = (...args: any[]) => {
    try {
      // @ts-ignore
      const [id, traits, options, cb] = resolvers.resolveUserArguments(...args)
      this.calls.group.push([id, traits, this.stamp(options), cb])
    } catch (err) {
      console.error(err)
    }
  }

  page = (...args: any[]) => {
    try {
      const [category, name, props, options, cb] =
        resolvers.resolvePageArguments(...args)
      this.stamp(options)
      this.calls.page.push([category, name, props, this.stamp(options), cb])
    } catch (err) {
      console.error(err)
    }
  }

  screen = (...args: any[]) => {
    try {
      const [category, name, props, options, cb] =
        resolvers.resolvePageArguments(...args)
      this.stamp(options)
      this.calls.screen.push([category, name, props, this.stamp(options), cb])
    } catch (err) {
      console.error(err)
    }
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
      // user may be onboarding and not have written a signal -- so do a noop so we can collect signals
      this.processSignal = Promise.resolve(
        `globalThis.processSignal = function processSignal() {}`
      )
      console.warn(
        `No processSignal function found. Have you written a processSignal function on app.segment.com?`
      )
      return
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
      ...AnalyticsEnums,
    }
    logger.debug('processing signal', { signal, scope, signals })
    const code = [
      await this.settings.processSignal,
      `const createSignalsRuntime = ${createSignalsRuntime.toString()}`,
      `const signals = createSignalsRuntime(${JSON.stringify(signals)})`,
      'try { processSignal(' +
        JSON.stringify(signal) +
        ', { analytics, signals, SignalType, EventType, NavigationAction }); } catch(err) { console.error("Process signal failed.", err); }',
    ].join('\n')
    await this.jsSandbox.run(code, scope)

    const calls = analytics.getCalls()
    return calls
  }
}
