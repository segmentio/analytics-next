// could be the buffered signals object?

import { Signal, SignalType, SignalOfType } from '../../types'

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

  find = <T extends SignalType>(
    fromSignal: Signal,
    signalType: T,
    predicate: (signal: SignalOfType<T>) => boolean
  ): SignalOfType<T> | undefined => {
    const _isSignalOfType = (signal: Signal): signal is SignalOfType<T> =>
      signal.type === signalType

    return this.buffer
      .slice(this.buffer.indexOf(fromSignal) + 1)
      .filter(_isSignalOfType)
      .find((signal) => predicate(signal))
  }
}
