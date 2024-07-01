import { SignalsIngestClient } from '../client'
import {
  getSignalBuffer,
  SignalPersistentStorage,
  SignalBuffer,
} from '../buffer'
import { SignalEmitter } from '../emitter'
import { domGenerators } from '../signal-generators/dom-generators'
import { NetworkGenerator } from '../signal-generators/network'
import {
  SignalGenerator,
  SignalGeneratorClass,
} from '../signal-generators/types'
import { AnyAnalytics, Signal } from '../../types'
import { registerGenerator } from '../signal-generators/register'
import { AnalyticsService } from '../analytics-service'
import { SignalEventProcessor } from '../processor/processor'
import { Sandbox, SandboxSettings } from '../processor/sandbox'

interface SignalsSettingsConfig {
  /**
   * Size of the default signal buffer.
   * If signalStorage is defined, this setting is ignored.
   */
  maxBufferSize?: number
  /**
   * Custom signal storage implementation.
   */
  signalStorage?: SignalPersistentStorage
  /**
   * Override the default signal processing function from the edge function. If this is set, the edge function will not be used.
   */
  processSignal?: string

  /**
   * Override host of the signals API, for a custom proxy
   * Should proxy to signals.segment.io/v1
   */
  apiHost?: string

  /**
   * Override host of the edge function, for a custom proxy
   * should proxy to 'cdn.edgefn.segment.com'
   */
  functionHost?: string

  /**
   * How many signals to flush at once when sending to the signals API
   * @default 3
   */
  flushAt?: number
}

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

/**
 * Global settings for the application
 * In the future this pattern may allows us to add settings which can be dynamically set by the user.
 * Currently, this is just a way to pass settings to the different parts of the application.
 */
class SignalGlobalSettings {
  sandbox: {
    functionHost: string | undefined
    processSignal: string | undefined
    edgeFnDownloadURL: string | undefined
  }
  signalBuffer: {
    signalStorage?: SignalPersistentStorage
    maxBufferSize?: number
  }
  ingestClient: {
    apiHost?: string
    flushAt?: number
  }

  setEdgeFnDownloadUrl(url: string) {
    this.sandbox.edgeFnDownloadURL = url
  }

  constructor(settings: SignalsSettingsConfig) {
    if (settings.maxBufferSize && settings.signalStorage) {
      throw new Error(
        'maxBufferSize and signalStorage cannot be defined at the same time'
      )
    }

    this.signalBuffer = {
      signalStorage: settings.signalStorage,
      maxBufferSize: settings.maxBufferSize,
    }
    this.ingestClient = {
      apiHost: settings.apiHost,
      flushAt: settings.flushAt,
    }
    this.sandbox = {
      functionHost: settings.functionHost,
      processSignal: settings.processSignal,
      edgeFnDownloadURL: undefined,
    }
  }
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

    const downloadURL = analyticsService.edgeFnSettings?.downloadURL
    if (downloadURL) {
      this.globalSettings.setEdgeFnDownloadUrl(downloadURL)
    }

    const sandbox = new Sandbox(
      new SandboxSettings(this.globalSettings.sandbox)
    )

    const processor = new SignalEventProcessor(analyticsService, sandbox)

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
