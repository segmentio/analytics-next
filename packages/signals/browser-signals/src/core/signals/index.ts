import { SignalsIngestClient } from '../client'
import {
  getSignalBuffer,
  SignalPersistentStorage,
  SignalBuffer,
} from '../buffer'
import { SignalEmitter } from '../emitter'
import { domGenerators } from '../signal-generators/dom-generators'
import {
  SignalGenerator,
  SignalGeneratorClass,
} from '../signal-generators/types'
import { AnyAnalytics, Signal } from '../../types'
import { registerGenerator } from '../signal-generators/register'
import { AnalyticsService } from '../analytics-service'
import { SignalEventProcessor } from '../processor/processor'
import { Sandbox, SandboxSettings } from '../processor/sandbox'

interface SignalsSettings {
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
 * Internal settings for the signals class.
 * This allows us to add settings which can be dynamically set by the user, if needed
 */
class SignalGlobalSettings {
  sandbox: {
    functionHost: string | undefined
    processSignal: string | undefined
    edgeFnDownloadUrl: string | undefined
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
    this.sandbox.edgeFnDownloadUrl = url
  }

  constructor(signalSettings: SignalsSettings) {
    if (signalSettings.maxBufferSize && signalSettings.signalStorage) {
      throw new Error(
        'maxBufferSize and signalStorage cannot be defined at the same time'
      )
    }

    this.signalBuffer = {
      signalStorage: signalSettings.signalStorage,
      maxBufferSize: signalSettings.maxBufferSize,
    }
    this.ingestClient = {
      apiHost: signalSettings.apiHost,
      flushAt: signalSettings.flushAt,
    }
    this.sandbox = {
      functionHost: signalSettings.functionHost,
      processSignal: signalSettings.processSignal,
      edgeFnDownloadUrl: undefined,
    }
  }
}

export class Signals implements ISignals {
  private buffer: SignalBuffer
  public signalEmitter: SignalEmitter
  private cleanup: VoidFunction[] = []
  private signalsClient: SignalsIngestClient
  private globalSettings: SignalGlobalSettings
  constructor(settingsConfig: SignalsSettings = {}) {
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

    void this.registerGenerator(domGenerators)
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
