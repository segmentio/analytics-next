import { Signal } from '@segment/analytics-signals-runtime'
import { SignalBuffer } from '../../buffer'
import { SignalsSubscriber, SignalsMiddlewareContext } from '../../emitter'
import { SignalEventProcessor } from '../../processor/processor'
import {
  normalizeEdgeFunctionURL,
  GlobalScopeSandbox,
  WorkerSandbox,
  WorkerSandboxSettings,
  SignalSandbox,
  NoopSandbox,
} from '../../processor/sandbox'

const GLOBAL_SCOPE_SANDBOX = true

export class SignalsEventProcessorSubscriber implements SignalsSubscriber {
  processor!: SignalEventProcessor
  buffer!: SignalBuffer
  load(ctx: SignalsMiddlewareContext) {
    this.buffer = ctx.buffer
    const sandboxSettings = ctx.unstableGlobalSettings.sandbox
    const normalizedEdgeFunctionURL = normalizeEdgeFunctionURL(
      sandboxSettings.functionHost,
      sandboxSettings.edgeFnDownloadURL
    )

    let sandbox: SignalSandbox
    if (!normalizedEdgeFunctionURL) {
      console.warn(
        `No processSignal function found. Have you written a processSignal function on app.segment.com?`
      )
      sandbox = new NoopSandbox()
    } else if (!GLOBAL_SCOPE_SANDBOX) {
      sandbox = new WorkerSandbox(
        new WorkerSandboxSettings({
          processSignal: sandboxSettings.processSignal,
          edgeFnDownloadURL: normalizedEdgeFunctionURL,
        })
      )
    } else {
      sandbox = new GlobalScopeSandbox({
        edgeFnDownloadURL: normalizedEdgeFunctionURL,
      })
    }

    this.processor = new SignalEventProcessor(ctx.analyticsInstance, sandbox)
  }
  async process(signal: Signal) {
    return this.processor.process(signal, await this.buffer.getAll())
  }
}
