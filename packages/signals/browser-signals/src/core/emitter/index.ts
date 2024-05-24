import { Emitter } from '@segment/analytics-generic-utils'
import { logger } from '../../lib/logger'
import { Signal } from '../../types'

export interface EmitSignal {
  emit: (signal: Signal) => void
}

export class SignalEmitter implements EmitSignal {
  private emitter = new Emitter<{ add: [Signal] }>()
  static init = false
  constructor() {
    if (SignalEmitter.init) {
      throw new Error('SignalEmitter is a singleton')
    }
    SignalEmitter.init = true
  }

  emit(signal: Signal) {
    logger.debug('new signal emitted', signal)
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
