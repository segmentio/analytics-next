// could be the buffered signals object?

// This needs to use the function keyword so that it can be stringified and run in a sandbox
/**
 * @param signals - List of signals, with the most recent signals first (LIFO).
 */
export function createSignalsRuntime(signals: Signal[]): SignalsRuntime {
  /**
   * @param fromSignal - signal to start searching from
   * @param signalType - type of signal to find (e.g. 'interaction')
   * @param predicate - optional predicate function to filter the signals (search domain only includes signals after the signal defined in `fromSignal`)
   * @returns First signal that matches the criteria, or undefined
   */
  function find<T extends SignalType>(
    fromSignal: Signal,
    signalType: T,
    predicate?: (signal: SignalOfType<T>) => boolean
  ): SignalOfType<T> | undefined {
    const results = filter(fromSignal, signalType, predicate)
    return results[0]
  }

  /**
   * @param fromSignal - signal to start searching from
   * @param predicate - optional predicate function to filter the signals
   * @returns signals after the current one.
   */
  function filter<T extends SignalType>(
    fromSignal: Signal,
    signalType: T,
    predicate?: (signal: SignalOfType<T>) => boolean
  ): SignalOfType<T>[] {
    const _isSignalOfType = (signal: Signal): signal is SignalOfType<T> =>
      signal.type === signalType
    return signals
      .slice(signals.indexOf(fromSignal) + 1)
      .filter(_isSignalOfType)
      .filter((signal) => (predicate ? predicate(signal) : () => true))
  }

  return {
    find,
    filter,
  }
}
