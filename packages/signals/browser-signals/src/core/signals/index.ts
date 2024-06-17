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
import { AnyAnalytics } from '../../types'
import { registerGenerator } from '../signal-generators/register'
import { AnalyticsService } from '../analytics-service'
import { SignalEventProcessor } from '../processor/processor'

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
}

interface ISignals {
  start(analytics: AnyAnalytics): Promise<void>
  stop(): void
  clearStorage(): void
  registerGenerator(
    generators: (SignalGeneratorClass | SignalGenerator)[]
  ): Promise<void>
}

export class Signals implements ISignals {
  private buffer: SignalBuffer
  private signalEmitter: SignalEmitter
  private cleanup: VoidFunction[] = []
  private signalsClient: SignalsIngestClient
  /**
   * String representation of the edge function.
   */
  private processSignal?: string

  constructor(settings: SignalsSettings = {}) {
    this.processSignal = settings.processSignal
    this.signalEmitter = new SignalEmitter()
    this.signalsClient = new SignalsIngestClient({ apiHost: settings.apiHost })

    void this.registerGenerator(domGenerators)

    this.buffer = getSignalBuffer({
      signalStorage: settings.signalStorage,
      maxBufferSize: settings.maxBufferSize,
    })

    this.signalEmitter.subscribe((signal) => {
      void this.buffer.add(signal)
    })

    this.signalEmitter.subscribe((signal) => {
      void this.signalsClient.send(signal)
    })
  }

  /**
   * Does the following:
   * - Sends any queued signals to the server.
   * - Augments the analytics client to transform events -> signals
   * - Registers custom signal generators.
   */
  async start(analytics: AnyAnalytics): Promise<void> {
    const analyticsService = new AnalyticsService(analytics)

    const processor = new SignalEventProcessor(analytics, {
      processSignal: this.processSignal,
    })
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
