export type ID = string | null | undefined

export interface BaseSignal {
  type: string
  anonymousId: ID
  timestamp: string
}

export type SignalOfType<
  AllSignals extends BaseSignal,
  SignalType extends AllSignals['type']
> = AllSignals & { type: SignalType }

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
