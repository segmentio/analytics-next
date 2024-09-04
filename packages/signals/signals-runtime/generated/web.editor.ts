export declare const SignalType: Readonly<{
  Interaction: 'interaction'
  Navigation: 'navigation'
  Network: 'network'
  LocalData: 'localData'
  Instrumentation: 'instrumentation'
  UserDefined: 'userDefined'
}>
export declare const EventType: Readonly<{
  Track: 'track'
  Page: 'page'
  Screen: 'screen'
  Identify: 'identify'
  Group: 'group'
  Alias: 'alias'
}>
export declare const NavigationAction: Readonly<{
  URLChange: 'urlChange'
  PageLoad: 'pageLoad'
}>
export type SignalTypeName =
  | 'navigation'
  | 'interaction'
  | 'instrumentation'
  | 'network'
  | 'userDefined'
export interface AppSignal<T extends SignalTypeName, Data> {
  type: T
  data: Data
}
export type InteractionData = ClickData | SubmitData | ChangeData
export interface SerializedTarget {
  [key: string]: any
}
export type ClickData = {
  eventType: 'click'
  target: SerializedTarget
}
export type SubmitData = {
  eventType: 'submit'
  submitter: SerializedTarget
}
export type ChangeData = {
  eventType: 'change'
  [key: string]: unknown
}
export type InteractionSignal = AppSignal<'interaction', InteractionData>
export interface BaseNavigationData<ActionType extends string> {
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
export interface InstrumentationData {
  rawEvent: unknown
}
export type InstrumentationSignal = AppSignal<
  'instrumentation',
  InstrumentationData
>
export type NetworkRequestData = {
  action: 'request'
  url: string
  method: string
  data: {
    [key: string]: unknown
  }
}
export type NetworkResponseData = {
  action: 'response'
  url: string
  data: {
    [key: string]: unknown
  }
}
export type NetworkData = NetworkRequestData | NetworkResponseData
export type NetworkSignal = AppSignal<'network', NetworkData>
export interface UserDefinedSignalData {
  [key: string]: any
}
export type UserDefinedSignal = AppSignal<'userDefined', UserDefinedSignalData>
export type SignalOfType<T extends SignalTypeName> = T extends 'interaction'
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
export type Signal =
  | InteractionSignal
  | NavigationSignal
  | InstrumentationSignal
  | NetworkSignal
  | UserDefinedSignal
