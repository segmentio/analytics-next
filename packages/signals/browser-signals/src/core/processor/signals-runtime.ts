// could be the buffered signals object?

import { Signal, SignalType, SignalOfType } from '../../types'

export type SignalsRuntime = ReturnType<typeof createSignalsRuntime>

export function createSignalsRuntime(prevSignals: Signal[]) {
  const buffer: Signal[] = prevSignals

  function filter(...args: Parameters<Array<Signal>['filter']>): Signal[] {
    return buffer.filter(...args)
  }

  function find<T extends SignalType>(
    fromSignal: Signal,
    signalType: T,
    predicate?: (signal: SignalOfType<T>) => boolean
  ): SignalOfType<T> | undefined {
    const _isSignalOfType = (signal: Signal): signal is SignalOfType<T> =>
      signal.type === signalType
    return buffer
      .slice(buffer.indexOf(fromSignal) + 1)
      .filter(_isSignalOfType)
      .find((signal) => (predicate ? predicate(signal) : () => true))
  }

  return {
    filter,
    find,
  }
}

type PromisifyFunction<Fn> = Fn extends (...args: any[]) => infer T
  ? (...args: Parameters<Fn>) => Promise<T>
  : never

// workerbox limitations -- return values get wrapped in a promise inside the processSignal function
export type SignalsRuntimePublicApi = {
  filter: PromisifyFunction<SignalsRuntime['filter']>
  find: <T extends SignalType>(
    fromSignal: Signal,
    signalType: T,
    predicate?: (signal: SignalOfType<T>) => boolean
  ) => Promise<SignalOfType<T> | undefined>
}
