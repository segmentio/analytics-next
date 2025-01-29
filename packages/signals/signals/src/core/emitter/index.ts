import { logger } from '../../lib/logger'
import { Signal } from '@segment/analytics-signals-runtime'
import { SignalGlobalSettings } from '../signals'

export interface EmitSignal {
  emit: (signal: Signal) => void
}

const logSignal = (signal: Signal) => {
  logger.info(
    'New signal:',
    signal.type,
    signal.data,
    ...(signal.type === 'interaction' && 'change' in signal.data
      ? ['change:', JSON.stringify(signal.data.change, null, 2)]
      : [])
  )
}

export type LoadContext = {
  settings: SignalGlobalSettings
  writeKey: string
}

interface SignalPlugin {
  /**
   * Wait for this to complete before emitting signals
   * Like a 'before' plugin, blocks the event pipeline
   */
  load(ctx: LoadContext): Promise<void> | void
  process(signal: Signal): Signal | null
}

export class SignalEmitter implements EmitSignal {
  private listeners = new Set<(signal: Signal) => void>()
  private middlewares: SignalPlugin[] = []
  private initialized = false // Controls buffering vs eager signal processing
  private signalQueue: Signal[] = [] // Buffer for signals emitted before initialization

  // Add a plugin
  addPlugin(plugin: SignalPlugin): void {
    this.middlewares.push(plugin)
  }

  // Emit a signal
  emit(signal: Signal): void {
    logSignal(signal)
    if (!this.initialized) {
      // Buffer the signal if not initialized
      this.signalQueue.push(signal)
      return
    }

    // Process and notify listeners
    this.processAndEmit(signal)
  }

  // Process and emit a signal
  private processAndEmit(signal: Signal): void {
    // Apply plugin; drop the signal if any plugin returns null
    for (const plugin of this.middlewares) {
      const processed = plugin.process(signal)
      if (processed === null) return // Drop the signal
    }

    // Notify listeners
    for (const listener of this.listeners) {
      listener(signal)
    }
  }

  // Initialize the emitter, load plugin, flush the buffer, and enable eager processing
  async initialize(settings: LoadContext): Promise<void> {
    if (this.initialized) return

    // Wait for all plugin to complete their load method
    await Promise.all(this.middlewares.map((mw) => mw.load(settings)))

    this.initialized = true

    // Process and emit all buffered signals
    while (this.signalQueue.length > 0) {
      const signal = this.signalQueue.shift() as Signal
      this.processAndEmit(signal)
    }
  }

  // Subscribe a listener to signals --  equivilant to a destination plugin?
  subscribe(listener: (signal: Signal) => void): void {
    if (!this.listeners.has(listener)) {
      logger.debug('subscribed')
      this.listeners.add(listener)
    }
  }

  // Unsubscribe a listener
  unsubscribe(listener: (signal: Signal) => void): void {
    if (this.listeners.delete(listener)) {
      logger.debug('unsubscribed')
    }
  }

  // Subscribe a listener to a single signal
  once(listener: (signal: Signal) => void): void {
    const wrappedListener = (signal: Signal) => {
      this.unsubscribe(wrappedListener)
      listener(signal)
    }
    this.subscribe(wrappedListener)
  }
}
