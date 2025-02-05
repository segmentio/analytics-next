import { getSignalBuffer, SignalBuffer } from '../buffer'
import { SignalEmitter, SignalsMiddleware } from '../emitter'
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
import { SignalGlobalSettings, SignalsSettingsConfig } from './settings'
import { logger } from '../../lib/logger'
import { LogLevelOptions } from '../debug-mode'
import { NetworkSignalsFilterMiddleware } from '../middleware/network-signals-filter/network-signals-filter'
import { SignalsIngestSubscriber } from '../middleware/signals-ingest'
import { SignalsEventProcessorSubscriber } from '../middleware/event-processor'

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
  private globalSettings: SignalGlobalSettings
  constructor(settingsConfig: SignalsSettingsConfig = {}) {
    this.globalSettings = new SignalGlobalSettings(settingsConfig)
    this.buffer = getSignalBuffer(this.globalSettings.signalBuffer)
    this.signalEmitter = this.getSignalEmitter(settingsConfig.middleware)

    // We register the generators (along with the signal emitter) so they start collecting signals before the plugin is started.
    // Otherwise, we would wait until analytics is loaded, which would skip things like page network URL changes.
    void this.registerGenerator([...domGenerators, new NetworkGenerator()])
  }

  /**
   * Does the following:
   * - Sends any queued signals to the server.
   * - Registers additional custom signal generators.
   */
  async start(analytics: AnyAnalytics): Promise<void> {
    const analyticsService = new AnalyticsService(analytics)

    analyticsService.instance.on('reset', () => {
      this.clearStorage()
    })

    // These settings are important to middleware configuration (e.g, they drop events)
    // The middleware doesn't run until the signalEmitter is initialized -- so we need to set these settings before starting the emitter
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

    await this.registerGenerator([
      analyticsService.createSegmentInstrumentationEventGenerator(),
    ])

    // load emitter and flush any queued signals to all subscribers. Register middleware
    void this.signalEmitter.start({
      unstableGlobalSettings: this.globalSettings,
      analyticsInstance: analyticsService.instance,
      buffer: this.buffer,
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
    if (!this.signalEmitter) {
      throw new Error('SignalEmitter not initialized')
    }
    if (!this.globalSettings) {
      throw new Error('GlobalSettings not initialized')
    }
    this.cleanup.push(
      await registerGenerator(
        this.signalEmitter,
        generators,
        this.globalSettings
      )
    )
  }

  private getSignalEmitter(middleware?: SignalsMiddleware[]): SignalEmitter {
    return new SignalEmitter({
      middleware: [...(middleware ?? []), new NetworkSignalsFilterMiddleware()],
    }).subscribe(
      (signal) => logger.logSignal(signal),
      (signal) => this.buffer.add(signal),
      new SignalsIngestSubscriber(),
      new SignalsEventProcessorSubscriber()
    )
  }
}
