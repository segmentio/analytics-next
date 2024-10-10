import { BaseSignal } from '../shared/shared-types'

export type MobileSignalTypes = MobileSignal['type']

export type MobileNavigationAction =
  | 'forward'
  | 'backward'
  | 'modal'
  | 'entering'
  | 'leaving'
  | 'page'
  | 'popup'

export type NetworkAction = 'request' | 'response'

export type LocalDataAction =
  | 'loaded'
  | 'updated'
  | 'saved'
  | 'deleted'
  | 'undefined'

export type MobileSignal =
  | MobileInteractionSignal
  | MobileNavigationSignal
  | MobileNetworkSignal
  | MobileLocalDataSignal
  | MobileInstrumentationSignal
  | MobileUserDefinedSignal

interface MobileRawSignal<SignalType extends string> extends BaseSignal {
  type: SignalType
  anonymousId: string
  data: any
  timestamp: string
  index: any
}

interface MobileNavigationData {
  action: MobileNavigationAction
  screen: string
}

interface MobileNavigationSignal extends MobileRawSignal<'navigation'> {
  data: MobileNavigationData
}

interface MobileInteractionData {
  component: string
  info: string
  data: any
}

interface MobileInteractionSignal extends MobileRawSignal<'interaction'> {
  type: 'interaction'
  data: MobileInteractionData
}

interface MobileNetworkData {
  action: NetworkAction
  url: string
  data: any
}

interface MobileNetworkSignal extends MobileRawSignal<'network'> {
  data: MobileNetworkData
}

interface MobileLocalData {
  action: LocalDataAction
  identifier: string
  data: string
}

interface MobileLocalDataSignal extends MobileRawSignal<'localData'> {
  data: MobileLocalData
}

interface MobileUserDefinedSignal extends MobileRawSignal<'userDefined'> {
  data: any
}

interface MobileInstrumentationData {
  type: 'instrumentation'
  rawEvent: any
}

interface MobileInstrumentationSignal
  extends MobileRawSignal<'instrumentation'> {
  data: MobileInstrumentationData
}
