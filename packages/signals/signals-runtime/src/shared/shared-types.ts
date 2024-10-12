export interface BaseSignal {
  type: string
}

export type SignalOfType<
  AllSignals extends BaseSignal,
  SignalType extends AllSignals['type']
> = AllSignals & { type: SignalType }

export interface ISignalsRuntime<Signal extends BaseSignal> {
  /**
   * Finds a signal of a specific type from a given signal.
   *
   * @template SignalType - The type of the signal to find.
   * @param fromSignal - The signal to search from.
   * @param signalType - The type of the signal to find.
   * @param predicate - Optional predicate function to filter the signals.
   * @returns The found signal of the specified type, or undefined if not found.
   */
  find: <SignalType extends Signal['type']>(
    fromSignal: Signal,
    signalType: SignalType,
    predicate?: (signal: SignalOfType<Signal, SignalType>) => boolean
  ) => SignalOfType<Signal, SignalType> | undefined

  /**
   * Filters signals of a specific type from a given signal.
   * @template SignalType - The type of the signals to filter.
   * @param fromSignal - The signal to search from.
   * @param signalType - The type of the signals to filter.
   * @param predicate - Optional predicate function to filter the signals.
   * @returns An array of signals of the specified type.
   */
  filter: <SignalType extends Signal['type']>(
    fromSignal: Signal,
    signalType: SignalType,
    predicate?: (signal: SignalOfType<Signal, SignalType>) => boolean
  ) => SignalOfType<Signal, SignalType>[]
}

export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { [member: string]: JSONValue }
export type JSONArray = JSONValue[]

export interface SegmentEvent {
  /**
   * @example 'track' | 'page' | 'screen' | 'identify' | 'group' | 'alias'
   */
  type: string
  [key: string]: unknown
}
