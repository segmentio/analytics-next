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
import { LogLevelOptions } from '../debug-mode'

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
    /**
     * TODO: add an event queue inside the signal emitter
     */
    this.signalEmitter = new SignalEmitter()
    this.signalsClient = new SignalsIngestClient(
      this.globalSettings.ingestClient
    )

    this.buffer = getSignalBuffer(this.globalSettings.signalBuffer)

    /**
     * TODO: support middleweware chain should be able to modify the signal before it is added to the buffer. This middleware chain should be something that will wait for cdn settings before it dispatches
     * (e.g, you can implement a disallow list that waits for the instance and then drops the signal)
     * It can be set at the emitter level, so that no signals actually get emitted until the middleware has initialized.
     */
    this.signalEmitter.subscribe((signal) => {
      void this.signalsClient.send(signal)
      void this.buffer.add(signal)
    })

    void this.registerGenerator([
      ...domGenerators,
      new NetworkGenerator(this.globalSettings.network),
    ])
  }

  /**
   * Does the following:
   * - Sends any queued signals to the server.
   * - Augments the analytics client to transform events -> signals
   * - Registers custom signal generators.
   */
  async start(analytics: AnyAnalytics): Promise<void> {
    const analyticsService = new AnalyticsService(analytics)

    analyticsService.instance.on('reset', () => {
      this.clearStorage()
    })

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

    const processor = new SignalEventProcessor(
      analyticsService.instance,
      new Sandbox(new SandboxSettings(this.globalSettings.sandbox))
    )

    // subscribe to all emitted signals
    this.signalEmitter.subscribe(async (signal) => {
      void processor.process(signal, await this.buffer.getAll())
    })

    await this.registerGenerator([
      analyticsService.createSegmentInstrumentationEventGenerator(),
    ])

    // flush pre start buffer and send any signals
    await this.signalsClient.init({
      writeKey: analyticsService.instance.settings.writeKey,
    })

    // load emitter and flush any queued signals to all subscribers
    void this.signalEmitter.initialize({
      settings: this.globalSettings,
      writeKey: analyticsService.instance.settings.writeKey,
    })
  }

  stop() {
    this.cleanup.forEach((fn) => fn())
  }

  clearStorage(): void {
    void this.buffer.clear()
  }

  /**
   * Disable redaction, ingestion of signals, and other logging.
   */
  debug(boolean = true, logLevel?: LogLevelOptions): void {
    this.globalSettings.signalsDebug.setAllDebugging(boolean)
    logger.enableLogging(logLevel ?? 'info')
  }

  /**
   * Register custom signal generators to emit signals.
   */
  async registerGenerator(
    generators: (SignalGeneratorClass | SignalGenerator)[]
  ): Promise<void> {
    this.cleanup.push(
      await registerGenerator(
        this.signalEmitter,
        generators,
        this.globalSettings
      )
    )
  }
}
