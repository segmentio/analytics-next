import { Signal } from '@segment/analytics-signals-runtime'
import { AnyAnalytics } from '../../types'
import { SignalBuffer } from '../buffer'
import { SignalGlobalSettings } from '../signals'

export interface EmitSignal {
  emit: (signal: Signal) => void
}

export interface SignalsMiddlewareContext {
  /**
   * These are global application settings. They are considered unstable, and should only be used internally.
   * @interal
   */
  readonly unstableGlobalSettings: SignalGlobalSettings

  /**
   * @internal
   */
  analyticsInstance: AnyAnalytics

  /**
   * @internal
   */
  buffer: SignalBuffer
}

export interface PluginSettings {
  writeKey: string
}

/**
 * A middleware is a plugin that modifies or drops signals
 */
export interface SignalsMiddleware {
  /**
   * Wait for .load to complete before emitting signals
   * This blocks the signal emitter until all plugins are loaded.
   */
  load(ctx: SignalsMiddlewareContext): Promise<void> | void
  process(signal: Signal): Signal | null
}

/**
 * A subscriber is basically a destination -- it receives a signal once it has travelled through the pipeline.
 */
export interface SignalsSubscriber {
  /**
   * Wait for .load to complete before emitting signals to this subscriber
   */
  load(ctx: SignalsMiddlewareContext): Promise<void> | void
  process(signal: Signal): void
}

export type AnySignalSubscriber = SignalsSubscriber | ((signal: Signal) => void)

/**
 * Normalizes all subscribers to a single interface
 * Waits for the current plugin to load before emitting signals
 * @internal
 */
class SignalsSubscriberAdapter implements SignalsSubscriber {
  subscriber: AnySignalSubscriber
  private loadedPromise?: Promise<void>
  constructor(subscriber: AnySignalSubscriber) {
    this.subscriber = subscriber
  }

  load(ctx: SignalsMiddlewareContext): void {
    if (typeof this.subscriber === 'function') return
    this.loadedPromise = Promise.resolve(this.subscriber.load(ctx))
  }

  process(signal: Signal): void {
    const sub = this.subscriber
    if (typeof sub === 'function') {
      sub(signal)
    } else {
      if (this.loadedPromise) {
        void this.loadedPromise.then(() => sub.process(signal))
      } else {
        throw new Error('load() must be called before process()')
      }
    }
  }
}

export interface SignalEmitterSettings {
  middleware?: SignalsMiddleware[]
}
export class SignalEmitter implements EmitSignal {
  private subscribers = new Set<SignalsSubscriberAdapter>()
  private middlewares: SignalsMiddleware[] = []
  private signalQueue: Signal[] = [] // Buffer for signals emitted before initialization
  private startedCtx?: SignalsMiddlewareContext // Context that .start() is called with. If this is defined, the emitter has been started.
  constructor(settings?: SignalEmitterSettings) {
    if (settings?.middleware) this.middlewares.push(...settings.middleware)
  }

  // Emit a signal
  emit(signal: Signal): void {
    if (!this.startedCtx) {
      // Buffer the signal if not initialized
      this.signalQueue.push(signal)
      return
    }

    // Process and notify listeners
    this.processAndEmit(signal)
  }

  // Initialize the emitter, load all plugins, flush the buffer, and enable eager processing
  async start(
    signalsMiddlewareContext: SignalsMiddlewareContext
  ): Promise<this> {
    if (this.startedCtx) return this

    // Wait for all plugin to complete their load method
    await Promise.all(
      this.middlewares.map((mw) => mw.load(signalsMiddlewareContext))
    )

    // Load all destinations, but do not wait for their load methods to be invoked.
    this.subscribers.forEach((sub) => {
      void sub.load(signalsMiddlewareContext)
    })

    this.startedCtx = signalsMiddlewareContext

    // Process and emit all buffered signals
    while (this.signalQueue.length > 0) {
      const signal = this.signalQueue.shift() as Signal
      // Never await -- if one destination fails to process, it should not block
      this.processAndEmit(signal)
    }
    return this
  }

  /**
   * Listen to signals emitted, once they have travelled through the plugin pipeline.
   * This is equivalent to a destination plugin.
   */
  subscribe(...subs: AnySignalSubscriber[]): this {
    subs
      .map((d) => new SignalsSubscriberAdapter(d))
      .forEach((d) => {
        if (!this.subscribers.has(d)) {
          this.subscribers.add(d)
          if (this.startedCtx) {
            void d.load(this.startedCtx)
          }
        }
      })
    return this
  }

  unsubscribe(...unsubbed: AnySignalSubscriber[]): this {
    unsubbed.forEach((toUnsubscribe) => {
      const adapter = [...this.subscribers].find(
        (s) => s.subscriber === toUnsubscribe
      )
      if (adapter) {
        this.subscribers.delete(adapter)
      }
    })
    return this
  }

  // Process and emit a signal
  private processAndEmit(signal: Signal): void {
    // Apply plugin; drop the signal if any plugin returns null
    for (const plugin of this.middlewares) {
      const processed = plugin.process(signal)
      if (processed === null) return // Drop the signal
    }

    // Process events for subscribers
    for (const subscriber of this.subscribers) {
      subscriber.process(signal)
    }
  }
}
