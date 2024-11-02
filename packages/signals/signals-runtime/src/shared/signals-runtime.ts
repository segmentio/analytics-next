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
    const foundIndex = this.signalBuffer.findIndex((el) => {
      // if can use referential comparison, use that. Or if has ID, use that to compare
      // or else, use JSON.stringify to do a deep comparison
      if (el === fromSignal) {
        return true
      } else if (
        // if both have id, compare id
        'id' in el &&
        'id' in fromSignal &&
        el.id !== undefined &&
        fromSignal.id !== undefined
      ) {
        return el.id === fromSignal.id
      } else if (
        'index' in el &&
        'index' in fromSignal &&
        el.index !== undefined &&
        fromSignal.index !== undefined
      ) {
        return el.index === fromSignal.index
      } else {
        return JSON.stringify(el) === JSON.stringify(fromSignal)
      }
    })

    if (foundIndex === -1) {
      console.warn(
        'Invariant: the fromSignal was not found in the signalBuffer'
      )
    }

    return this.filterBuffer(
      this.signalBuffer.slice(foundIndex + 1),
      signalType,
      predicate
    )
  }

  private filterBuffer = <SignalType extends Signal['type']>(
    buffer: Signal[],
    signalType: SignalType,
    predicate?: (signal: SignalOfType<Signal, SignalType>) => boolean
  ): SignalOfType<Signal, SignalType>[] => {
    const _isSignalOfType = (
      signal: Signal
    ): signal is SignalOfType<Signal, SignalType> => signal.type === signalType

    return buffer
      .filter(_isSignalOfType)
      .filter((signal) => (predicate ? predicate(signal) : () => true))
  }
}
