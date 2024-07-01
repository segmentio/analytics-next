export type SignalType =
  | 'navigation'
  | 'interaction'
  | 'instrumentation'
  | 'network'

export interface AppSignal<T extends SignalType, Data> {
  type: T
  data: Data
}

type InteractionData = ClickData | SubmitData | ChangeData

interface SerializedTarget {
  // nodeName: Node['nodeName']
  // textContent: Node['textContent']
  // nodeValue: Node['nodeValue']
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

interface NavigationData {
  [key: string]: unknown
}
export type NavigationSignal = AppSignal<'navigation', NavigationData>

interface InstrumentationData {
  rawEvent: unknown
}
export type InstrumentationSignal = AppSignal<
  'instrumentation',
  InstrumentationData
>

type NetworkRequestData = {
  action: 'Request'
  url: string
  method: string
  data: { [key: string]: unknown }
}

type NetworkResponseData = {
  action: 'Response'
  url: string
  data: { [key: string]: unknown }
}

export type NetworkData = NetworkRequestData | NetworkResponseData

export type NetworkSignal = AppSignal<'network', NetworkData>

/**
 * Internal signal type
 */
export type Signal =
  | InteractionSignal
  | NavigationSignal
  | InstrumentationSignal
  | NetworkSignal
