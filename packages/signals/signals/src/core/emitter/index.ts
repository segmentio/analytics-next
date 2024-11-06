import { Emitter } from '@segment/analytics-generic-utils'
import { logger } from '../../lib/logger'
import { Signal } from '@segment/analytics-signals-runtime'

export interface EmitSignal {
  emit: (signal: Signal) => void
}

export class SignalEmitter implements EmitSignal {
  private emitter = new Emitter<{ add: [Signal] }>()

  emit(signal: Signal) {
    logger.debug('New signal:', signal.type, signal.data)
    this.emitter.emit('add', signal)
  }

  subscribe(broadcaster: (signal: Signal) => void) {
    logger.debug('subscribed')
    this.emitter.on('add', broadcaster)
  }

  unsubscribe(listener: (signal: Signal) => void) {
    logger.debug('unsubscribed')
    this.emitter.off('add', listener)
  }
}
