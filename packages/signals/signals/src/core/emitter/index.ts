import { Emitter } from '@segment/analytics-generic-utils'
import { logger } from '../../lib/logger'
import { Signal } from '@segment/analytics-signals-runtime'

export interface EmitSignal {
  emit: (signal: Signal) => void
}

const logSignal = (signal: Signal) => {
  logger.info(
    'New signal:',
    signal.type,
    signal.data,
    signal.type === 'interaction' && signal.data.eventType === 'change'
      ? {
          value: signal.data.target.value,
          changedAttribute: signal.data.target.changedAttribute,
          changedValue: signal.data.target.changedValue,
        }
      : undefined
  )
}

export class SignalEmitter implements EmitSignal {
  private emitter = new Emitter<{ add: [Signal] }>()
  private listeners = new Set<(signal: Signal) => void>()

  emit(signal: Signal) {
    logSignal(signal)
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
