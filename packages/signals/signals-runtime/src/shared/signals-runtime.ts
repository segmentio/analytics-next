import {
  BaseSignal,
  SignalOfType,
  ISignalsRuntime,
} from '../shared/shared-types'

/**
 * Base class that provides runtime utilities for signals.
 */
export abstract class SignalsRuntime<Signal extends BaseSignal = BaseSignal>
  implements ISignalsRuntime<Signal>
{
  signalBuffer: Signal[]

  constructor(signals: Signal[] = []) {
    // initial signals
    this.signalBuffer = signals
  }

  find = <SignalType extends Signal['type']>(
    fromSignal: Signal,
    signalType: SignalType,
    predicate?: (signal: SignalOfType<Signal, SignalType>) => boolean
  ): SignalOfType<Signal, SignalType> | undefined => {
    return this.filter(fromSignal, signalType, predicate)[0]
  }

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
