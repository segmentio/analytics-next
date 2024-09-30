export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { [member: string]: JSONValue }
export type JSONArray = JSONValue[]

export type SignalType = Signal['type']

export interface AppSignal<T extends SignalType, Data> {
  type: T
  data: Data
  metadata?: Record<string, any>
}

export type InteractionData = ClickData | SubmitData | ChangeData

interface SerializedTarget {
  // nodeName: Node['nodeName']
  // textContent: Node['textContent']
  // nodeType: Node['nodeType']
  [key: string]: any
}

type ClickData = {
  eventType: 'click'
  target: SerializedTarget
}

type SubmitData = {
  eventType: 'submit'
  submitter: SerializedTarget
}

type ChangeData = {
  eventType: 'change'
  [key: string]: unknown
}

export type InteractionSignal = AppSignal<'interaction', InteractionData>

interface BaseNavigationData<ActionType extends string> {
  action: ActionType
  url: string
  hash: string
}

export interface URLChangeNavigationData
  extends BaseNavigationData<'urlChange'> {
  prevUrl: string
}

export interface PageChangeNavigationData
  extends BaseNavigationData<'pageLoad'> {}

export type NavigationData = URLChangeNavigationData | PageChangeNavigationData

export type NavigationSignal = AppSignal<'navigation', NavigationData>

interface InstrumentationData {
  rawEvent: unknown
}
export type InstrumentationSignal = AppSignal<
  'instrumentation',
  InstrumentationData
>

export interface NetworkSignalMetadata {
  filters: {
    allowed: string[]
    disallowed: string[]
  }
}

interface BaseNetworkData {
  action: string
  url: string
  data: JSONValue
}

interface NetworkRequestData extends BaseNetworkData {
  action: 'request'
  url: string
  method: string
}

interface NetworkResponseData extends BaseNetworkData {
  action: 'response'
  url: string
}

export type NetworkData = NetworkRequestData | NetworkResponseData

export type NetworkSignal = AppSignal<'network', NetworkData>

export interface UserDefinedSignalData {
  [key: string]: any
}

export type UserDefinedSignal = AppSignal<'userDefined', UserDefinedSignalData>

export type SignalOfType<T extends SignalType> = Signal & { type: T }

export type Signal =
  | InteractionSignal
  | NavigationSignal
  | InstrumentationSignal
  | NetworkSignal
  | UserDefinedSignal

export interface SegmentEvent {
  type: string // e.g 'track'
  [key: string]: any
}

export interface SignalsRuntimeAPI {
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
