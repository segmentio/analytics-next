export type SignalType =
  | 'navigation'
  | 'interaction'
  | 'instrumentation'
  | 'network'
  | 'userDefined'

export interface AppSignal<T extends SignalType, Data> {
  type: T
  data: Data
}

export type InteractionData = ClickData | SubmitData | ChangeData

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

type NetworkRequestData = {
  action: 'request'
  url: string
  method: string
  data: { [key: string]: unknown }
}

type NetworkResponseData = {
  action: 'response'
  url: string
  data: { [key: string]: unknown }
}

export type NetworkData = NetworkRequestData | NetworkResponseData

export type NetworkSignal = AppSignal<'network', NetworkData>

export interface UserDefinedSignalData {
  [key: string]: any
}

export type UserDefinedSignal = AppSignal<'userDefined', UserDefinedSignalData>

export type SignalOfType<T extends SignalType> = T extends 'interaction'
  ? InteractionSignal
  : T extends 'navigation'
  ? NavigationSignal
  : T extends 'instrumentation'
  ? InstrumentationSignal
  : T extends 'userDefined'
  ? UserDefinedSignal
  : T extends 'network'
  ? NetworkSignal
  : never
/**
 * Internal signal type
 */
export type Signal =
  | InteractionSignal
  | NavigationSignal
  | InstrumentationSignal
  | NetworkSignal
  | UserDefinedSignal

interface SegmentEvent {
  type: string // e.g 'track'
  [key: string]: any
}
/**
 * Factories
 */
export const createInstrumentationSignal = (
  rawEvent: SegmentEvent
): InstrumentationSignal => {
  return {
    type: 'instrumentation',
    data: {
      rawEvent: rawEvent,
    },
  }
}

export const createInteractionSignal = (
  data: InteractionData
): InteractionSignal => {
  return {
    type: 'interaction',
    data,
  }
}

export const createNavigationSignal = (
  data: NavigationData
): NavigationSignal => {
  return {
    type: 'navigation',
    data,
  }
}

export const createUserDefinedSignal = (
  data: UserDefinedSignalData
): UserDefinedSignal => {
  return {
    type: 'userDefined',
    data,
  }
}

export const createNetworkSignal = (data: NetworkData): NetworkSignal => {
  return {
    type: 'network',
    data,
  }
}
