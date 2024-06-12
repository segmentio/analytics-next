import {
  resolveAliasArguments,
  resolveArguments,
  resolvePageArguments,
  resolveUserArguments,
} from '@segment/analytics-next'
import { logger } from '../../lib/logger'
import createWorkerBox from 'workerboxjs'

import { Signal } from '../../types'
import { SignalsRuntime } from './signals-runtime'

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
class AnalyticsRuntime {
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
    const wb = await this.workerbox
    await wb.run(fn, scope)
  }

  async destroy(): Promise<void> {
    const wb = await this.workerbox
    await wb.destroy()
  }
}

export type EdgeFnSettings =
  | {
      edgeFnOverride: string
      edgeFnDownloadUrl?: string
    }
  | {
      edgeFnOverride?: string
      edgeFnDownloadUrl: string
    }

export type SandboxSettingsConfig = {} & EdgeFnSettings

class SandboxSettings {
  /**
   * Should look like:
   * ```js
   * function processSignal(signal) {
   * ...
   * }
   * ```
   */
  edgeFn: Promise<string>
  constructor(settings: SandboxSettingsConfig) {
    if (!settings.edgeFnDownloadUrl && !settings.edgeFnOverride) {
      throw new Error('edgeFnDownloadUrl or edgeFnOverride is required')
    }
    this.edgeFn = (
      settings.edgeFnOverride
        ? Promise.resolve(settings.edgeFnOverride)
        : fetch(settings.edgeFnDownloadUrl!).then((res) => res.text())
    ).then((processSignalFn) => {
      this.validateEdgeFn(processSignalFn)
      return processSignalFn
    })
  }

  private validateEdgeFn(processSignalFn: string): void {
    if (!processSignalFn.includes('processSignal')) {
      throw new Error(
        'edge function must contain a function named processSignal.'
      )
    }
  }
}

export class Sandbox {
  settings: SandboxSettings
  jsSandbox: CodeSandbox

  constructor(settings: SandboxSettingsConfig) {
    this.settings = new SandboxSettings(settings)
    this.jsSandbox = new JavascriptSandbox()
  }

  async process(
    signal: Signal,
    signals: Signal[]
  ): Promise<AnalyticsMethodCalls> {
    const analytics = new AnalyticsRuntime()
    const scope = {
      Signals: new SignalsRuntime(signals),
      analytics,
    }
    logger.debug('processing signal', { signal, scope, signals })
    const processSignalFn = await this.settings.edgeFn
    const code = [
      processSignalFn,
      'processSignal(' + JSON.stringify(signal) + ');',
    ].join('\n')
    await this.jsSandbox.run(code, scope)
    const calls = analytics.getCalls()
    logger.debug('analytics calls', analytics.getCalls())
    return calls
  }
}
