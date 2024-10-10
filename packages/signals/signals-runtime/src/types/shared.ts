export interface BaseSignal {
  type: string
}

export type SignalOfType<
  AllSignals extends BaseSignal,
  SignalType extends AllSignals['type']
> = AllSignals & { type: SignalType }
