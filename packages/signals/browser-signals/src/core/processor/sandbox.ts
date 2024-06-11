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
export type BufferedSegmentEvents = Record<MethodName, any[]>

/**
 * Proxy around the analytics client
 */
class AnalyticsRuntime {
  private calls: BufferedSegmentEvents = {
    page: [],
    identify: [],
    track: [],
    alias: [],
    screen: [],
    group: [],
  }

  getCalls(): BufferedSegmentEvents {
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

type SandboxSettings = {} & EdgeFnSettings

export type EdgeFnSettings =
  | {
      edgeFnOverride: string
      edgeFnDownloadUrl?: string
    }
  | {
      edgeFnOverride?: string
      edgeFnDownloadUrl: string
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

export class Sandbox {
  edgeFn: Promise<string>
  jsSandbox: CodeSandbox

  constructor(settings: SandboxSettings) {
    console.log(settings)
    if (!settings.edgeFnDownloadUrl && !settings.edgeFnOverride) {
      throw new Error('edgeFnDownloadUrl or edgeFnOverride is required')
    }
    this.edgeFn = settings.edgeFnOverride
      ? Promise.resolve(settings.edgeFnOverride)
      : fetch(settings.edgeFnDownloadUrl!).then((res) => res.text())
    this.jsSandbox = new JavascriptSandbox()
  }

  async process(
    signal: Signal,
    signals: Signal[]
  ): Promise<BufferedSegmentEvents> {
    const analytics = new AnalyticsRuntime()
    const scope = {
      Signals: new SignalsRuntime(signals),
      analytics,
    }
    logger.debug('processing signal', { signal, scope, signals })
    const code = [
      `globalThis.processSignal = ${await this.edgeFn};`,
      'processSignal(' + JSON.stringify(signal) + ');',
    ].join('\n')
    await this.jsSandbox.run(code, scope)
    const calls = analytics.getCalls()
    logger.debug('analytics calls', analytics.getCalls())
    return calls
  }
}

//      class Sandbox {
//     	edgeFn: Promise<string>
//     	jsSandbox = createWorkerBox()
//        signalsRuntime: Signals

//        constructor(edgeFnDownloadURL: URL, signals: Signals) {
//           this.edgeFn = fetch(edgeFnDownloadURL).then(res => res.text())
//        }

//     async process(signal: Signal): SegmentEvents => {
//         const scope = {
//             Signals: this.signalsRuntime,
//             analytics: new AnalyticsStub(),
//             processSignal: await edgeFn,
//         }

//         await this.sandbox.run("processSignal(" + JSON.stringify(signal) + ");", scope)
//         return analyticsStub.events
//     }

//     cleanup() {
//         return this.jsSandbox.destroy()
//     }
// }
