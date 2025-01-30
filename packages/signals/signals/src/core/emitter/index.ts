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

export interface SignalsMiddlewareContext {
  /**
   * These are global application settings. They are considered unstable, and should only be used internally.
   * @interal
   */
  unstableGlobalSettings: SignalGlobalSettings
  writeKey: string
}

export interface PluginSettings {
  writeKey: string
}

export interface SignalsMiddleware {
  /**
   * Wait for .load to complete before emitting signals
   * This blocks the signal emitter until all plugins are loaded.
   */
  load(ctx: SignalsMiddlewareContext): Promise<void> | void
  process(signal: Signal): Signal | null
}

export interface SignalEmitterSettings {
  middleware?: SignalsMiddleware[]
}
export class SignalEmitter implements EmitSignal {
  private listeners = new Set<(signal: Signal) => void>()
  private middlewares: SignalsMiddleware[] = []
  private initialized = false // Controls buffering vs eager signal processing
  private signalQueue: Signal[] = [] // Buffer for signals emitted before initialization

  constructor(settings?: SignalEmitterSettings) {
    if (settings?.middleware) this.middlewares.push(...settings.middleware)
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
  async initialize({
    globalSettings,
    writeKey,
  }: {
    globalSettings: SignalGlobalSettings
    writeKey: string
  }): Promise<void> {
    if (this.initialized) return

    // Wait for all plugin to complete their load method
    await Promise.all(
      this.middlewares.map((mw) =>
        mw.load({ unstableGlobalSettings: globalSettings, writeKey })
      )
    )

    this.initialized = true

    // Process and emit all buffered signals
    while (this.signalQueue.length > 0) {
      const signal = this.signalQueue.shift() as Signal
      this.processAndEmit(signal)
    }
  }

  /**
   * Listen to signals emitted, once they have travelled through the plugin pipeline.
   * This is equivalent to a destination plugin.
   */
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
}
