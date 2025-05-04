import { logger } from '../../lib/logger'
import { resolvers } from './arg-resolvers'
import { AnalyticsRuntimePublicApi, ProcessSignal } from '../../types'
import { replaceBaseUrl } from '../../lib/replace-base-url'
import {
  Signal,
  WebRuntimeConstants,
  WebSignalsRuntime,
} from '@segment/analytics-signals-runtime'
import { getRuntimeCode } from '@segment/analytics-signals-runtime'
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

const PROCESS_SIGNAL_UNDEFINED =
  'processSignal is not defined - have you set up auto-instrumentation on app.segment.com?'

const consoleWarnProcessSignal = () => console.warn(PROCESS_SIGNAL_UNDEFINED)

export interface SignalSandbox {
  execute(
    signal: Signal,
    signals: Signal[]
  ): Promise<AnalyticsMethodCalls | undefined>
  destroy(): void | Promise<void>
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
      constants: WebRuntimeConstants,
    })
  } finally {
    // restore globals
    g['analytics'] = originalAnalytics
    g['signals'] = originalSignals
  }

  return analytics.getCalls()
}

/**
 * Sandbox that invokes processSignal in the global scope (avoids all CSP errors)
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

/**
 * Sandbox that executes code in an iframe.
 * Pros:
 *  - More secure
 * Cons:
 * - Can trigger CSP errors unless :blob directive is present
 */
export class IframeSandbox implements SignalSandbox {
  private iframe: HTMLIFrameElement
  private iframeReady: Promise<void>
  private _resolveReady!: () => void
  edgeFnUrl: string

  constructor(edgeFnUrl: string, processSignalFn?: string) {
    logger.debug('Initializing iframe sandbox')
    this.edgeFnUrl = edgeFnUrl
    this.iframe = document.createElement('iframe')
    this.iframe.id = 'segment-signals-sandbox'
    this.iframe.style.display = 'none'
    this.iframe.src = 'about:blank'
    document.body.appendChild(this.iframe)
    this.iframeReady = new Promise((res) => {
      this._resolveReady = res
    })

    void window.addEventListener('message', (e) => {
      if (e.source === this.iframe.contentWindow && e.data === 'iframe_ready') {
        this.iframe.contentWindow!.postMessage({
          type: 'init',
        })
        this._resolveReady()
      }
    })

    const doc = this.iframe.contentDocument!
    doc.open()
    doc.write(
      [
        `<!DOCTYPE html>`,
        `<html>`,
        `<head>`,
        processSignalFn
          ? ''
          : `<script id="edge-fn" src=${this.edgeFnUrl}></script>`,
        `</head>`,
        `<body></body>
      </html>`,
      ].join(',')
    )
    doc.close()

    // External signal processor script
    // Inject runtime via Blob (CSP-safe)
    const runtimeJs = `
    ${processSignalFn ? `window.processSignal = ${processSignalFn}` : ''}

     const signalsScript = document.getElementById('edge-fn')
     if (typeof processSignal === 'undefined') {
      signalsScript.onload = () => {
        window.parent.postMessage('iframe_ready')
       }
      } else {
        window.parent.postMessage('iframe_ready')
      }
 
      class AnalyticsRuntimeProxy {
        constructor() {
          this.calls = new Map();
        }
        getCalls() {
          return Object.fromEntries(this.calls); // call in {track: [args]} format
        }
        createProxy() {
          return new Proxy({}, {
            get: (_, methodName) => {
              return (...args) => {
                if (!this.calls.has(methodName)) {
                  this.calls.set(methodName, []);
                }
                this.calls.get(methodName).push(args);
              };
            },
          });
        }
      }
        

      // expose the signals global
      ${getRuntimeCode()}

      window.addEventListener('message', async (event) => {
        const { type, payload } = event.data;

        
        if (type === 'execute') {
          try {
            const analyticsProxy = new AnalyticsRuntimeProxy();
            window.analytics = analyticsProxy.createProxy();
            if (!payload.signal) {
              throw new Error('invariant: no signal found')
            }
            if (!payload.signalBuffer) {
              throw new Error('invariant: no signalBuffer found')
            }
            if (!payload.constants) {
              throw new Error('invariant: no constants found')
            }
            if (typeof processSignal === 'undefined') {
              throw new Error('processSignal is undefined')
            }
      
            const signalBuffer = payload.signalBuffer
            const signal = payload.signal
            const constants = payload.constants
            Object.entries(constants).forEach(([key, value]) => { // expose constants as globals
              window[key] = value;
            });
            window.signals.signalBuffer = signalBuffer; // signals is exposed as part of get runtimeCode
            window.processSignal(signal, { signals, constants })
            event.source.postMessage({ type: 'execution_result', payload: analyticsProxy.getCalls() });
         } catch(err) {
            event.source.postMessage({ type: 'execution_error', error: err }); 
         } 
        }
      });


    `
    const blob = new Blob([runtimeJs], { type: 'application/javascript' })
    const runtimeScript = doc.createElement('script')
    runtimeScript.src = URL.createObjectURL(blob)

    doc.head.appendChild(runtimeScript)
  }

  private normalizeAnalyticsMethodCallsWithArgResolver = (
    methodCalls: AnalyticsMethodCalls
  ) => {
    const analytics = new AnalyticsRuntime()
    Object.entries(methodCalls).forEach(([methodName, calls]) => {
      calls.forEach((args) => {
        // @ts-ignore
        analytics[methodName](...args)
      })
    })
    return analytics.getCalls()
  }

  async execute(
    signal: Signal,
    signals: Signal[]
  ): Promise<AnalyticsMethodCalls> {
    await this.iframeReady

    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        if (e.source !== this.iframe.contentWindow) return
        if (e.data?.type === 'execution_result') {
          window.removeEventListener('message', handler)
          const methodCalls = this.normalizeAnalyticsMethodCallsWithArgResolver(
            e.data.payload
          )
          resolve(methodCalls)
        }
        if (e.data?.type === 'execution_error') {
          window.removeEventListener('message', handler)
          reject(e.data.error)
        }
      }

      window.addEventListener('message', handler)

      this.iframe.contentWindow!.postMessage({
        type: 'execute',
        payload: {
          signal,
          signalBuffer: signals,
          constants: WebRuntimeConstants,
        },
      })
    })
  }

  destroy() {
    this.iframe.remove()
  }
}
