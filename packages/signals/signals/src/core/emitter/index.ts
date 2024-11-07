import { Emitter } from '@segment/analytics-generic-utils'
import { logger } from '../../lib/logger'
import { Signal } from '@segment/analytics-signals-runtime'

export interface EmitSignal {
  emit: (signal: Signal) => void
}

interface SignalEmitterSettings {
  shouldLogSignals: () => boolean
}

export class SignalEmitter implements EmitSignal {
  private emitter = new Emitter<{ add: [Signal] }>()
  private listeners = new Set<(signal: Signal) => void>()
  private settings?: SignalEmitterSettings
  constructor(settings?: SignalEmitterSettings) {
    this.settings = settings
  }
  emit(signal: Signal) {
    if (this.settings?.shouldLogSignals()) {
      logger.log('New signal:', signal.type, signal.data)
    }
    this.emitter.emit('add', signal)
  }

  subscribe(listener: (signal: Signal) => void) {
    // Prevent duplicate subscriptions
    if (!this.listeners.has(listener)) {
      logger.debug('subscribed')
      this.listeners.add(listener)
    }
    this.emitter.on('add', listener)
  }

  unsubscribe(listener: (signal: Signal) => void) {
    this.listeners.delete(listener)
    logger.debug('unsubscribed')
    this.emitter.off('add', listener)
  }

  once(listener: (signal: Signal) => void) {
    this.emitter.once('add', listener)
  }
}
