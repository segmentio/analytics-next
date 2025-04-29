import { logger } from '../../lib/logger'
import { createWorkerBox, WorkerBoxAPI } from '../../lib/workerbox'
import { resolvers } from './arg-resolvers'
import { AnalyticsRuntimePublicApi, ProcessSignal } from '../../types'
import { replaceBaseUrl } from '../../lib/replace-base-url'
import {
  Signal,
  WebRuntimeConstants,
  WebSignalsRuntime,
} from '@segment/analytics-signals-runtime'
import { getRuntimeCode } from '@segment/analytics-signals-runtime'
import { polyfills } from './polyfills'
import { loadScript } from '../../lib/load-script'

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
export type AnalyticsMethodCalls = Record<MethodName, any[]> & {
  reset: unknown[]
}

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
    reset: [],
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

  reset = () => {
    this.calls.reset.push([])
  }
}

interface CodeSandbox {
  run: (fn: string, scope: Record<string, any>) => Promise<any>
  destroy: () => Promise<void>
}

class JavascriptSandbox implements CodeSandbox {
  private workerbox: Promise<WorkerBoxAPI>
  constructor() {
    this.workerbox = createWorkerBox()
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

export const normalizeEdgeFunctionURL = (
  functionHost: string | undefined,
  edgeFnDownloadURL: string | undefined
) => {
  if (functionHost && edgeFnDownloadURL) {
    replaceBaseUrl(edgeFnDownloadURL, `https://${functionHost}`)
  } else {
    return edgeFnDownloadURL
  }
}

export type SandboxSettingsConfig = {
  functionHost: string | undefined
  processSignal: string | undefined
  edgeFnDownloadURL: string | undefined
  edgeFnFetchClient?: typeof fetch
  sandboxStrategy: 'iframe' | 'global'
}

export type IframeSandboxSettingsConfig = Pick<
  SandboxSettingsConfig,
  'processSignal' | 'edgeFnFetchClient' | 'edgeFnDownloadURL'
>

const consoleWarnProcessSignal = () =>
  console.warn(
    'processSignal is not defined - have you set up auto-instrumentation on app.segment.com?'
  )

export class IframeSandboxSettings {
  /**
   * Should look like:
   * ```js
   * function processSignal(signal) {
   * ...
   * }
   * ```
   */
  processSignal: Promise<string>
  constructor(settings: IframeSandboxSettingsConfig) {
    const fetch = settings.edgeFnFetchClient ?? globalThis.fetch

    let processSignalNormalized = Promise.resolve(
      `globalThis.processSignal = function() {}`
    )

    if (settings.processSignal) {
      processSignalNormalized = Promise.resolve(settings.processSignal).then(
        (str) => `globalThis.processSignal = ${str}`
      )
    } else if (settings.edgeFnDownloadURL) {
      processSignalNormalized = fetch(settings.edgeFnDownloadURL!).then((res) =>
        res.text()
      )
    } else {
      consoleWarnProcessSignal()
    }

    this.processSignal = processSignalNormalized
  }
}

export interface SignalSandbox {
  execute(
    signal: Signal,
    signals: Signal[]
  ): Promise<AnalyticsMethodCalls | undefined>
  destroy(): void | Promise<void>
}

export class WorkerSandbox implements SignalSandbox {
  settings: IframeSandboxSettings
  jsSandbox: CodeSandbox

  constructor(settings: IframeSandboxSettings) {
    this.settings = settings
    this.jsSandbox = new JavascriptSandbox()
  }

  async execute(
    signal: Signal,
    signals: Signal[]
  ): Promise<AnalyticsMethodCalls> {
    const analytics = new AnalyticsRuntime()
    const scope = {
      analytics,
    }
    logger.debug('processing signal', { signal, scope, signals })
    const code = [
      polyfills,
      await this.settings.processSignal,
      getRuntimeCode(),
      `signals.signalBuffer = ${JSON.stringify(signals)};`,
      'try { processSignal(' +
        JSON.stringify(signal) +
        ', { analytics, signals, SignalType, EventType, NavigationAction }); } catch(err) { console.error("Process signal failed.", err); }',
    ].join('\n')
    await this.jsSandbox.run(code, scope)

    const calls = analytics.getCalls()
    return calls
  }
  destroy(): void {
    void this.jsSandbox.destroy()
  }
}

// ProcessSignal unfortunately uses globals. This should change.
// For now, we are setting up the globals between each invocation
const processWithGlobalScopeExecutionEnv = (
  signal: Signal,
  signalBuffer: Signal[]
): AnalyticsMethodCalls | undefined => {
  const g = globalThis as any
  const processSignal: ProcessSignal = g['processSignal']

  if (typeof processSignal == 'undefined') {
    consoleWarnProcessSignal()
    return undefined
  }

  // Load all constants into the global scope
  Object.entries(WebRuntimeConstants).forEach(([key, value]) => {
    g[key] = value
  })

  // processSignal expects a global called `signals` -- of course, there can local variable naming conflict on the client, which is why globals were a bad idea.
  const analytics = new AnalyticsRuntime()
  const signals = new WebSignalsRuntime(signalBuffer)

  const originalAnalytics = g.analytics
  try {
    if (g['analytics'] instanceof AnalyticsRuntime) {
      throw new Error(
        'Invariant: analytics variable was not properly restored on the previous execution. This indicates a concurrency bug'
      )
    }

    g['analytics'] = analytics

    g['signals'] = signals
    processSignal(signal, {
      // we eventually want to get rid of globals and processSignal just uses local variables.
      analytics: analytics,
      signals: signals,
      // constants
      EventType: WebRuntimeConstants.EventType,
      NavigationAction: WebRuntimeConstants.NavigationAction,
      SignalType: WebRuntimeConstants.SignalType,
    })
  } finally {
    // restore globals
    g['analytics'] = originalAnalytics
  }

  // this seems like it could potentially cause bugs in async environment
  g.analytics = originalAnalytics
  return analytics.getCalls()
}

/**
 * Sandbox that avoids CSP errors, but evaluates everything globally
 */
interface GlobalScopeSandboxSettings {
  edgeFnDownloadURL: string
}
export class GlobalScopeSandbox implements SignalSandbox {
  htmlScriptLoaded: Promise<HTMLScriptElement>

  constructor(settings: GlobalScopeSandboxSettings) {
    logger.debug('Initializing global scope sandbox')
    this.htmlScriptLoaded = loadScript(settings.edgeFnDownloadURL)
  }

  async execute(signal: Signal, signals: Signal[]) {
    await this.htmlScriptLoaded
    return processWithGlobalScopeExecutionEnv(signal, signals)
  }
  destroy(): void {}
}

export class NoopSandbox implements SignalSandbox {
  execute(_signal: Signal, _signals: Signal[]) {
    return Promise.resolve(undefined)
  }
  destroy(): void | Promise<void> {
    return
  }
}
