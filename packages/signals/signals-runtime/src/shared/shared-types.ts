export interface BaseSignal {
  type: string
}

export type SignalOfType<
  AllSignals extends BaseSignal,
  SignalType extends AllSignals['type']
> = AllSignals & { type: SignalType }

export interface ISignalsRuntime<Signal extends BaseSignal> {
  find: <SignalType extends Signal['type']>(
    fromSignal: Signal,
    signalType: SignalType,
    predicate?: (signal: SignalOfType<Signal, SignalType>) => boolean
  ) => SignalOfType<Signal, SignalType> | undefined
}
