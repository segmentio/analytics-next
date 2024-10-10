import { BaseSignal, JSONValue } from '../shared/shared-types'

export type WebSignalTypes = WebSignal['type']

export interface WebAppSignal<T extends WebSignalTypes, Data>
  extends BaseSignal {
  type: T
  data: Data
  metadata?: Record<string, any>
}

export type WebInteractionData = WebClickData | WebSubmitData | WebChangeData

interface WebSerializedTarget {
  [key: string]: any
}

type WebClickData = {
  eventType: 'click'
  target: WebSerializedTarget
}

type WebSubmitData = {
  eventType: 'submit'
  submitter: WebSerializedTarget
}

type WebChangeData = {
  eventType: 'change'
  [key: string]: unknown
}

export type WebInteractionSignal = WebAppSignal<
  'interaction',
  WebInteractionData
>

interface WebBaseNavigationData<ActionType extends string> {
  action: ActionType
  url: string
  hash: string
}

export interface WebURLChangeNavigationData
  extends WebBaseNavigationData<'urlChange'> {
  prevUrl: string
}

export interface WebPageChangeNavigationData
  extends WebBaseNavigationData<'pageLoad'> {}

export type WebNavigationData =
  | WebURLChangeNavigationData
  | WebPageChangeNavigationData

export type WebNavigationSignal = WebAppSignal<'navigation', WebNavigationData>

interface WebInstrumentationData {
  rawEvent: unknown
}
export type WebInstrumentationSignal = WebAppSignal<
  'instrumentation',
  WebInstrumentationData
>

export interface WebNetworkSignalMetadata {
  filters: {
    allowed: string[]
    disallowed: string[]
  }
}

interface WebBaseNetworkData {
  action: string
  url: string
  data: JSONValue
}

interface WebNetworkRequestData extends WebBaseNetworkData {
  action: 'request'
  url: string
  method: string
}

interface WebNetworkResponseData extends WebBaseNetworkData {
  action: 'response'
  url: string
}

export type WebNetworkData = WebNetworkRequestData | WebNetworkResponseData

export type WebNetworkSignal = WebAppSignal<'network', WebNetworkData>

export interface WebUserDefinedSignalData {
  [key: string]: any
}

export type WebUserDefinedSignal = WebAppSignal<
  'userDefined',
  WebUserDefinedSignalData
>

export type WebSignal =
  | WebInteractionSignal
  | WebNavigationSignal
  | WebInstrumentationSignal
  | WebNetworkSignal
  | WebUserDefinedSignal
