// could be the buffered signals object?

import { Signal, SignalType } from '../../types'

// This can't get indexdb, it needs to have all the signals in memory.
export class SignalsRuntime {
  buffer: Signal[]
  // @ts-ignore
  constructor(currentSignal: Signal, prevSignals: Signal[]) {
    this.buffer = prevSignals
  }

  filter = (...args: Parameters<Array<Signal>['filter']>): Signal[] => {
    return this.buffer.filter(...args)
  }

  find = (
    fromSignal: Signal,
    signalType: SignalType,
    predicate: (signal: Signal) => boolean
  ): Signal | undefined => {
    return this.buffer
      .slice(this.buffer.indexOf(fromSignal))
      .filter((el) => el.type === signalType)
      .find((signal) => predicate(signal))
  }
}
