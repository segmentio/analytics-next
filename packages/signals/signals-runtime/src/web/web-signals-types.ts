import { BaseSignal, JSONValue } from '../shared/shared-types'

export type SignalTypes = Signal['type']

export interface RawSignal<T extends SignalTypes, Data> extends BaseSignal {
  type: T
  data: Data
  metadata?: Record<string, any>
}

export type InteractionData = ClickData | SubmitData | ChangeData

interface SerializedTarget {
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

export type InteractionSignal = RawSignal<'interaction', InteractionData>

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

export type NavigationSignal = RawSignal<'navigation', NavigationData>

interface InstrumentationData {
  rawEvent: unknown
}
export type InstrumentationSignal = RawSignal<
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
  status: number
  ok: boolean
}

export type NetworkData = NetworkRequestData | NetworkResponseData

export type NetworkSignal = RawSignal<'network', NetworkData>

export interface UserDefinedSignalData {
  [key: string]: any
}

export type UserDefinedSignal = RawSignal<'userDefined', UserDefinedSignalData>

export type Signal =
  | InteractionSignal
  | NavigationSignal
  | InstrumentationSignal
  | NetworkSignal
  | UserDefinedSignal
