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
  submitter?: SerializedTarget
  target: SerializedTarget
}

type ChangeData = {
  eventType: 'change'
  [key: string]: unknown
}

export type InteractionSignal = RawSignal<'interaction', InteractionData>

interface BaseNavigationData<ActionType extends string> {
  action: ActionType
  url: string
  /**
   * The hash part of the URL, including the leading `#`
   * @example '#section1'
   */
  hash: string
  /**
   * The path part of the URL, including the leading `/`
   * @example '/home'
   */
  path: string
  /**
   * The search part of the URL, including the leading `?`
   * @example '?utm_source=google'
   */
  /**
   * The title of the page
   * @example 'Home Page'
   */
  title: string
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
  action: 'request' | 'response'
  url: string
  /**
   * The content of the request or response
   * @example { key: 'value' }
   */
  data: JSONValue
  /**
   * The content type of the request or response
   * @example 'application/json'
   */
  contentType: string
}

interface NetworkRequestData extends BaseNetworkData {
  action: 'request'
  url: string
  /**
   * The HTTP method used for the request
   * @example 'GET' | 'POST' | 'PUT' | 'DELETE'
   */
  method: string
}

interface NetworkResponseData extends BaseNetworkData {
  action: 'response'
  url: string
  /**
   * The status code of the response
   * @example 200
   */
  status: number
  /**
   * Whether the request was successful
   * For example, a status code of 200-299 is considered successful
   */
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
