// could be the buffered signals object?

import { Signal, SignalTypeName, SignalOfType } from '../types/web'

export interface SignalsRuntimeHelpers {
  find: <T extends SignalTypeName>(
    fromSignal: Signal,
    signalType: T,
    predicate?: (signal: SignalOfType<T>) => boolean
  ) => SignalOfType<T> | undefined

  filter: (...args: Parameters<Array<Signal>['filter']>) => Signal[]
}

// This needs to use the function keyword so that it can be stringified and run in a sandbox
/**
 * @param signals - List of signals, with the most recent signals first (LIFO).
 * #### 1.) Use the helper functions to find and filter signals
 * @example
 * ```ts
 * const signalHelper = createSignalsRuntimeHelpers(fetchSignals())
 * const found = signalsHelper.find(signal, 'interaction', (signal) => signal.data.eventType === 'click')
 * ```
 *
 * @example
 * #### 2.) Be fancy, and use as a mix-in for a class
 * ```ts
 * export class Signals {
 *  private signals: Signal[] = []
 *  constructor() {
 *     this.signals = fetchSignals()
 *     Object.assign(this, createSignalsRuntimeHelpers(this.signals))
 *  }
 *
 * interface Signals extends SignalsRuntimeHelpers {}
 *
 * const signals = new Signals()
 * const found = signals.find(signal, 'interaction', (signal) => signal.data.eventType === 'click')
 * ```
 */

export function createSignalsRuntimeHelpers(
  signals: Signal[]
): SignalsRuntimeHelpers {
  /**
   * @param fromSignal - signal to start searching from
   * @param signalType - type of signal to find (e.g. 'interaction')
   * @param predicate - optional predicate function to filter the signals (search domain only includes signals after the signal defined in `fromSignal`)
   * @returns signals after the current one.
   */
  function find<T extends SignalTypeName>(
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

  /**
   * Filter signals - includes the current signal
   */
  function filter(...args: Parameters<Array<Signal>['filter']>): Signal[] {
    return signals.filter(...args)
  }

  return {
    find,
    filter,
  }
}
