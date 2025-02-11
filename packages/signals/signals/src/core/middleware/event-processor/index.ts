import { Signal } from '@segment/analytics-signals-runtime'
import { SignalBuffer } from '../../buffer'
import { SignalsSubscriber, SignalsMiddlewareContext } from '../../emitter'
import { SignalEventProcessor } from '../../processor/processor'
import { Sandbox, SandboxSettings } from '../../processor/sandbox'

export class SignalsEventProcessorSubscriber implements SignalsSubscriber {
  processor!: SignalEventProcessor
  buffer!: SignalBuffer
  load(ctx: SignalsMiddlewareContext) {
    this.buffer = ctx.buffer
    this.processor = new SignalEventProcessor(
      ctx.analyticsInstance,
      new Sandbox(new SandboxSettings(ctx.unstableGlobalSettings.sandbox))
    )
  }
  async process(signal: Signal) {
    return this.processor.process(signal, await this.buffer.getAll())
  }
}
