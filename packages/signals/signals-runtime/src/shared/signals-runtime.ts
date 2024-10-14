import { BaseSignal, SignalOfType } from '../shared/shared-types'

/**
 * Base class that provides runtime utilities for signals.
 */
export abstract class SignalsRuntime<Signal extends BaseSignal = BaseSignal> {
  signalBuffer: Signal[]

  constructor(signals: Signal[] = []) {
    // initial signals
    this.signalBuffer = signals
  }

  /**
   * Finds a signal of a specific type from a given signal.
   *
   * SignalType - The type of the signal to find.
   * @param fromSignal - The signal to search from.
   * @param signalType - The type of the signal to find.
   * @param predicate - Optional predicate function to filter the signals.
   * @returns The found signal of the specified type, or undefined if not found.
   */
  find = <SignalType extends Signal['type']>(
    fromSignal: Signal,
    signalType: SignalType,
    predicate?: (signal: SignalOfType<Signal, SignalType>) => boolean
  ): SignalOfType<Signal, SignalType> | undefined => {
    return this.filter(fromSignal, signalType, predicate)[0]
  }

  /**
   * Filters signals of a specific type from a given signal.
   * SignalType - The type of the signals to filter.
   * @param fromSignal - The signal to search from.
   * @param signalType - The type of the signals to filter.
   * @param predicate - Optional predicate function to filter the signals.
   * @returns An array of signals of the specified type.
   */
  filter = <SignalType extends Signal['type']>(
    fromSignal: Signal,
    signalType: SignalType,
    predicate?: (signal: SignalOfType<Signal, SignalType>) => boolean
  ): SignalOfType<Signal, SignalType>[] => {
    const _isSignalOfType = (
      signal: Signal
    ): signal is SignalOfType<Signal, SignalType> => signal.type === signalType
    return this.signalBuffer
      .slice(this.signalBuffer.indexOf(fromSignal) + 1)
      .filter(_isSignalOfType)
      .filter((signal) => (predicate ? predicate(signal) : () => true))
  }
}
