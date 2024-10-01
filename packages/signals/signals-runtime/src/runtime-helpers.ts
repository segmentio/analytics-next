import {
  SignalsRuntimeAPI,
  SignalOfType,
  Signal,
  SignalTypes,
} from './types/web/signals'

export function createSignalsRuntimeHelpers(
  signals: Signal[]
): SignalsRuntimeAPI {
  /**
   * @param fromSignal - signal to start searching from
   * @param signalType - type of signal to find (e.g. 'interaction')
   * @param predicate - optional predicate function to filter the signals (search domain only includes signals after the signal defined in `fromSignal`)
   * @returns signals after the current one.
   */
  function find<T extends SignalTypes>(
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
    find,
  }
}
