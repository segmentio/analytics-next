import type { Signal, SignalType, SignalOfType } from '../types'

export type SignalsRuntime = {
  find: <T extends SignalType>(
    fromSignal: Signal,
    signalType: T,
    predicate?: (signal: SignalOfType<T>) => boolean
  ) => SignalOfType<T> | undefined
  filter: <T extends SignalType>(
    fromSignal: Signal,
    signalType: T,
    predicate?: (signal: SignalOfType<T>) => boolean
  ) => SignalOfType<T>[]
}
