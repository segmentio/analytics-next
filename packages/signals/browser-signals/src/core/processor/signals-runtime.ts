// could be the buffered signals object?

import { Signal, SignalType, SignalOfType } from '../../types'

export type SignalsRuntime = ReturnType<typeof createSignalsRuntime>

// This needs to use the function keyword so that it can be stringified and run in a sandbox
/**
 *
 * @param signals - List of signals, with the most recent signals first (LIFO).
 */
export function createSignalsRuntime(signals: Signal[]) {
  const prevSignals = signals
  function filter(...args: Parameters<Array<Signal>['filter']>): Signal[] {
    return prevSignals.filter(...args)
  }

  function find<T extends SignalType>(
    fromSignal: Signal,
    signalType: T,
    predicate?: (signal: SignalOfType<T>) => boolean
  ): SignalOfType<T> | undefined {
    const _isSignalOfType = (signal: Signal): signal is SignalOfType<T> =>
      signal.type === signalType
    return signals
      .slice(signals.indexOf(fromSignal) + 1)
      .filter(_isSignalOfType)
      .find((signal) => (predicate ? predicate(signal) : () => true))
  }

  return {
    filter,
    find,
  }
}
