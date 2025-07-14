import { logger } from '../../lib/logger'
import { createWorkerBox, WorkerBoxAPI } from '../../lib/workerbox'
import { ProcessSignal } from '../../types'
import { replaceBaseUrl } from '../../lib/replace-base-url'
import { Signal, WebSignalsRuntime } from '@segment/analytics-signals-runtime'
import { getRuntimeCode } from '@segment/analytics-signals-runtime'
import { polyfills } from './polyfills'
import { loadScript } from '../../lib/load-script'
import {
  AnalyticsMethodCalls,
  AnalyticsRuntime,
  MethodName,
} from './sandbox-analytics-runtime'

export type { AnalyticsMethodCalls, MethodName }

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
        ', { analytics, signals }); } catch(err) { console.error("Process signal failed.", err); }',
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

  // processSignal expects a global called `signals` -- of course, there can local variable naming conflict on the client, which is why globals were a bad idea.
  const analytics = new AnalyticsRuntime()
  const signals = new WebSignalsRuntime(signalBuffer)

  const originalAnalytics = g.analytics
  if (originalAnalytics instanceof AnalyticsRuntime) {
    throw new Error(
      'Invariant: analytics variable was not properly restored on the previous execution. This indicates a concurrency bug'
    )
  }
  const originalSignals = g.signals

  try {
    g['analytics'] = analytics
    g['signals'] = signals
    processSignal(signal, {
      // we eventually want to get rid of globals and processSignal just uses local variables.
      // TODO: update processSignal generator to accept params like these for web (mobile currently uses globals for their architecture -- can be changed but hard).
      analytics: analytics,
      signals: signals,
      // constants
    })
  } finally {
    // restore globals
    g['analytics'] = originalAnalytics
    g['signals'] = originalSignals
  }

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
  destroy(): void {}
}
