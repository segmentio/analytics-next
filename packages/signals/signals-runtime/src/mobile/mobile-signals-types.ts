import { BaseSignal } from '../shared/shared-types'

export type SignalTypes = Signal['type']

export type NavigationActionName =
  | 'forward'
  | 'backward'
  | 'modal'
  | 'entering'
  | 'leaving'
  | 'page'
  | 'popup'

export type NetworkActionName = 'request' | 'response'

export type LocalDataActionName =
  | 'loaded'
  | 'updated'
  | 'saved'
  | 'deleted'
  | 'undefined'

export type Signal =
  | InteractionSignal
  | NavigationSignal
  | NetworkSignal
  | LocalDataSignal
  | InstrumentationSignal
  | UserDefinedSignal

interface RawSignal<SignalType extends string> extends BaseSignal {
  type: SignalType
  anonymousId: string
  data: any
  timestamp: string
  index: any
}

interface NavigationData {
  action: NavigationActionName
  screen: string
}

interface NavigationSignal extends RawSignal<'navigation'> {
  data: NavigationData
}

interface InteractionData {
  component: string
  info: string
  data: any
}

interface InteractionSignal extends RawSignal<'interaction'> {
  type: 'interaction'
  data: InteractionData
}

interface NetworkData {
  action: NetworkActionName
  url: string
  data: any
}

interface NetworkSignal extends RawSignal<'network'> {
  data: NetworkData
}

interface LocalData {
  action: LocalDataActionName
  identifier: string
  data: string
}

interface LocalDataSignal extends RawSignal<'localData'> {
  data: LocalData
}

interface UserDefinedSignal extends RawSignal<'userDefined'> {
  data: any
}

interface InstrumentationData {
  type: 'instrumentation'
  rawEvent: any
}

interface InstrumentationSignal extends RawSignal<'instrumentation'> {
  data: InstrumentationData
}
