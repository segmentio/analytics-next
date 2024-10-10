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

export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { [member: string]: JSONValue }
export type JSONArray = JSONValue[]

export interface SegmentEvent {
  type: string // e.g 'track'
  [key: string]: any
}
