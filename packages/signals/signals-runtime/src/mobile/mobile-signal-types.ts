import { BaseSignal } from '../shared/shared-types'

export type MobileSignalTypes = MobileSignal['type']

export type MobileSignal =
  | MobileInteractionSignal
  | MobileNavigationSignal
  | MobileNetworkSignal
  | MobileLocalDataSignal
  | MobileInstrumentationSignal
  | MobileUserDefinedSignal

interface MobileRawSignal extends BaseSignal {
  anonymousId: string
  type: string
  data: any
  timestamp: string
  index: any
}

interface MobileNavigationData {
  action: string
  screen: string
}

interface MobileNavigationSignal extends MobileRawSignal {
  data: MobileNavigationData
}

interface MobileInteractionData {
  component: string
  info: string
  data: any
}

interface MobileInteractionSignal extends MobileRawSignal {
  type: 'interaction'
  data: MobileInteractionData
}

interface MobileNetworkData {
  action: string
  url: string
  data: any
}

interface MobileNetworkSignal extends MobileRawSignal {
  static: 'network'
  data: MobileNetworkData
}

interface MobileLocalData {
  action: string
  identifier: string
  data: string
}

interface MobileLocalDataSignal extends MobileRawSignal {
  type: 'localData'
  data: MobileLocalData
}

interface MobileUserDefinedSignal extends MobileRawSignal {
  type: 'userDefined'
  data: any
}

interface MobileInstrumentationData {
  type: 'instrumentation'
  rawEvent: any
}

interface MobileInstrumentationSignal extends MobileRawSignal {
  data: MobileInstrumentationData
}
