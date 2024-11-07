import { SignalsIngestClient } from '../client'
import { getSignalBuffer, SignalBuffer } from '../buffer'
import { SignalEmitter } from '../emitter'
import { domGenerators } from '../signal-generators/dom-gen'
import { NetworkGenerator } from '../signal-generators/network-gen'
import {
  SignalGenerator,
  SignalGeneratorClass,
} from '../signal-generators/types'
import { Signal } from '@segment/analytics-signals-runtime'
import { AnyAnalytics } from '../../types'
import { registerGenerator } from '../signal-generators/register'
import { AnalyticsService } from '../analytics-service'
import { SignalEventProcessor } from '../processor/processor'
import { Sandbox, SandboxSettings } from '../processor/sandbox'
import { SignalGlobalSettings, SignalsSettingsConfig } from './settings'
import { logger } from '../../lib/logger'

interface ISignals {
  start(analytics: AnyAnalytics): Promise<void>
  stop(): void
  clearStorage(): void
  registerGenerator(
    generators: (SignalGeneratorClass | SignalGenerator)[]
  ): Promise<void>
}

export type SignalsPublicEmitterContract = {
  signal: [Signal]
}

export class Signals implements ISignals {
  private buffer: SignalBuffer
  private preStartBuffer: Signal[] = []
  public signalEmitter: SignalEmitter
  private cleanup: VoidFunction[] = []
  private signalsClient: SignalsIngestClient
  private globalSettings: SignalGlobalSettings
  constructor(settingsConfig: SignalsSettingsConfig = {}) {
    this.globalSettings = new SignalGlobalSettings(settingsConfig)
    this.signalEmitter = new SignalEmitter()
    this.signalsClient = new SignalsIngestClient(
      this.globalSettings.ingestClient
    )

    this.buffer = getSignalBuffer(this.globalSettings.signalBuffer)

    this.signalEmitter.subscribe((signal) => {
      void this.signalsClient.send(signal)
      void this.buffer.add(signal)
    })

    this.signalEmitter.subscribe(this.addToPreStartBuffer)

    void this.registerGenerator([
      ...domGenerators,
      new NetworkGenerator(this.globalSettings.network),
    ])
  }

  private addToPreStartBuffer = (signal: Signal) => {
    this.preStartBuffer.push(signal)
  }

  /**
   * Flush/process any signals that were emitted before the start method was called.
   */
  private flushPreStartBuffer = (processor: SignalEventProcessor) => {
    logger.debug(
      `Flushing ${this.preStartBuffer.length} events in pre-start buffer`,
      this.preStartBuffer
    )
    this.signalEmitter.unsubscribe(this.addToPreStartBuffer)
    this.preStartBuffer.forEach(async (signal) => {
      void processor.process(signal, await this.buffer.getAll())
    })
    this.preStartBuffer = []
  }

  /**
   * Does the following:
   * - Sends any queued signals to the server.
   * - Augments the analytics client to transform events -> signals
   * - Registers custom signal generators.
   */
  async start(analytics: AnyAnalytics): Promise<void> {
    const analyticsService = new AnalyticsService(analytics)

    this.globalSettings.update({
      edgeFnDownloadURL: analyticsService.edgeFnSettings?.downloadURL,
      disallowListURLs: [
        analyticsService.instance.settings.apiHost,
        analyticsService.instance.settings.cdnURL,
      ],
      sampleRate:
        analyticsService.instance.settings.cdnSettings
          .autoInstrumentationSettings?.sampleRate ?? 0,
    })

    const sandbox = new Sandbox(
      new SandboxSettings(this.globalSettings.sandbox)
    )

    const processor = new SignalEventProcessor(
      analyticsService.instance,
      sandbox
    )

    void this.flushPreStartBuffer(processor)

    this.signalEmitter.subscribe(async (signal) => {
      void processor.process(signal, await this.buffer.getAll())
    })

    await this.registerGenerator([
      analyticsService.createSegmentInstrumentationEventGenerator(),
    ])

    await this.signalsClient.init({
      writeKey: analyticsService.instance.settings.writeKey,
    })
  }

  stop() {
    this.cleanup.forEach((fn) => fn())
  }

  clearStorage(): void {
    void this.buffer.clear()
  }

  // create a reference so we prevent duplicate subscriptions
  private logSignal = (signal: Signal) => {
    logger.log(signal.type, signal.data, signal.metadata)
  }
  /**
   * Disable redaction, ingestion of signals, and other debug logging.
   */
  debug(boolean = true): void {
    this.globalSettings.signalsDebug.setAllDebugging(boolean)
    this.signalEmitter.subscribe(this.logSignal)
  }

  /**
   * Register custom signal generators to emit signals.
   */
  async registerGenerator(
    generators: (SignalGeneratorClass | SignalGenerator)[]
  ): Promise<void> {
    this.cleanup.push(await registerGenerator(this.signalEmitter, generators))
  }
}
