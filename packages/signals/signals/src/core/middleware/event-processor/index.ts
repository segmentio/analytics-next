import { Signal } from '@segment/analytics-signals-runtime'
import { logger } from '../../../lib/logger'
import { SignalBuffer } from '../../buffer'
import { SignalsSubscriber, SignalsMiddlewareContext } from '../../emitter'
import { SignalEventProcessor } from '../../processor/processor'
import {
  normalizeEdgeFunctionURL,
  GlobalScopeSandbox,
  WorkerSandbox,
  IframeSandboxSettings,
  SignalSandbox,
  NoopSandbox,
} from '../../processor/sandbox'

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
      logger.debug('Initializing sandbox: noop')
      sandbox = new NoopSandbox()
    } else if (
      sandboxSettings.sandboxStrategy === 'iframe' ||
      sandboxSettings.processSignal
    ) {
      logger.debug('Initializing sandbox: iframe')
      sandbox = new WorkerSandbox(
        new IframeSandboxSettings({
          processSignal: sandboxSettings.processSignal,
          edgeFnDownloadURL: normalizedEdgeFunctionURL,
        })
      )
    } else {
      logger.debug('Initializing sandbox: global scope')
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
