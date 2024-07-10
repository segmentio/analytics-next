import { SignalsIngestClient } from '../client'
import { getSignalBuffer, SignalBuffer } from '../buffer'
import { SignalEmitter } from '../emitter'
import { domGenerators } from '../signal-generators/dom-gen'
import { NetworkGenerator } from '../signal-generators/network-gen'
import {
  SignalGenerator,
  SignalGeneratorClass,
} from '../signal-generators/types'
import { AnyAnalytics, Signal } from '../../types'
import { registerGenerator } from '../signal-generators/register'
import { AnalyticsService } from '../analytics-service'
import { SignalEventProcessor } from '../processor/processor'
import { Sandbox, SandboxSettings } from '../processor/sandbox'
import { SignalGlobalSettings, SignalsSettingsConfig } from './settings'

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

    void this.registerGenerator([...domGenerators, NetworkGenerator])
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
    })

    const sandbox = new Sandbox(
      new SandboxSettings(this.globalSettings.sandbox)
    )

    const processor = new SignalEventProcessor(
      analyticsService.instance,
      sandbox
    )

    this.signalEmitter.subscribe(async (signal) => {
      void processor.process(signal, await this.buffer.getAll())
    })

    await this.registerGenerator([
      analyticsService.createSegmentInstrumentationEventGenerator(),
    ])

    await this.signalsClient.init({ writeKey: analyticsService.writeKey })
  }

  stop() {
    this.cleanup.forEach((fn) => fn())
  }

  clearStorage(): void {
    void this.buffer.clear()
  }

  /**
   * Emit custom signals.
   */
  async registerGenerator(
    generators: (SignalGeneratorClass | SignalGenerator)[]
  ): Promise<void> {
    this.cleanup.push(await registerGenerator(this.signalEmitter, generators))
  }
}
