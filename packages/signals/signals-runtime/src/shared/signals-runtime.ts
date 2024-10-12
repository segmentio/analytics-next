import {
  BaseSignal,
  SignalOfType,
  ISignalsRuntime,
} from '../shared/shared-types'

/**
 * SignalsRuntime class to manage signals
 * @param AnySignal - Type of signals
 * @param signals - List of signals, with the most recent signals first (LIFO).
 * @returns SignalsRuntime object
 * @example
 * type MobileSignal = NavigationSignal | InteractionSignal | SomeOtherMobileSpecificSignal
 * const signalsRuntime = new SignalsRuntime<MobileSignal>([])
 * signalsRuntime.add({
 *  index: 0,
 *  type: 'foo'
 * })
 */
export class SignalsRuntime<Signal extends BaseSignal = BaseSignal>
  implements ISignalsRuntime<Signal>
{
  private signalBuffer: Signal[]
  // mobile only - see brandon for this code
  private signalCounter: number
  // mobile only - see brandon for this code
  private maxBufferSize: number

  constructor(signals: Signal[]) {
    // initial signals
    this.signalBuffer = signals
    // mobile only -- see brandon for this code
    this.signalCounter = 0
    this.maxBufferSize = 1000
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

  // mobile only - see brandon for this code
  add = (signal: Signal) => {
    if (this.signalCounter < 0) {
      this.signalCounter = 0
    }

    if ('index' in signal && signal.index == -1) {
      // this was previously broken for ages, not sure when this code path would ever be used.
      // My understanding is that currently, getNextIndex() is called _outside_ of this function and used to construct the added signal. - seth
      signal.index = this.getNextIndex()
    }
    this.signalBuffer.unshift(signal)
    if (this.signalBuffer.length > this.maxBufferSize) {
      this.signalBuffer.pop()
    }
  }

  // mobile only - see brandon for this code
  getNextIndex = () => {
    const index = this.signalCounter
    this.signalCounter += 1
    return index
  }
}
