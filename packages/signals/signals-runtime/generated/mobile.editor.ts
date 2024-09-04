declare const signals: SignalsRuntimeHelpers

type SignalTypeName =
  | 'navigation'
  | 'interaction'
  | 'instrumentation'
  | 'network'
  | 'userDefined'
  | 'localData'

interface SignalsRuntimeHelpers {
  find: <T extends SignalTypeName>(
    fromSignal: Signal,
    signalType: T,
    predicate: (signal: SignalOfType<T>) => boolean
  ) => SignalOfType<T> | undefined
}

type SignalOfType<T extends SignalTypeName> = T extends 'interaction'
  ? InteractionSignal
  : T extends 'navigation'
  ? NavigationSignal
  : T extends 'instrumentation'
  ? InstrumentationSignal
  : T extends 'userDefined'
  ? UserDefinedSignal
  : T extends 'localData'
  ? LocalDataSignal
  : T extends 'network'
  ? NetworkSignal
  : never

type Signal =
  | InteractionSignal
  | NavigationSignal
  | NetworkSignal
  | LocalDataSignal
  | InstrumentationSignal
  | UserDefinedSignal

declare const SignalType: Readonly<{
  Interaction: 'interaction'
  Navigation: 'navigation'
  Network: 'network'
  LocalData: 'localData'
  Instrumentation: 'instrumentation'
  UserDefined: 'userDefined'
}>

declare const NavigationAction: Readonly<{
  Forward: 'forward'
  Backward: 'backward'
  Modal: 'modal'
  Entering: 'entering'
  Leaving: 'leaving'
  Page: 'page'
  Popup: 'popup'
}>

declare const EventType: Readonly<{
  Track: 'track'
  Page: 'page'
  Screen: 'screen'
  Identify: 'identify'
  Group: 'group'
  Alias: 'alias'
}>

declare const NetworkAction: Readonly<{
  Request: 'request'
  Response: 'response'
}>

declare const LocalDataAction: Readonly<{
  Loaded: 'loaded'
  Updated: 'updated'
  Saved: 'saved'
  Deleted: 'deleted'
  Undefined: 'undefined'
}>

interface RawSignal {
  anonymousId: string
  type: SignalTypeName
  data: any
  timestamp: string
  index: any
}

interface NavigationData {
  action: string
  screen: string
}

interface NavigationSignal extends RawSignal {
  type: 'navigation'
  data: NavigationData
}

interface InteractionData {
  component: string
  info: string
  data: any
}

interface InteractionSignal extends RawSignal {
  type: 'interaction'
  data: InteractionData
}

interface NetworkData {
  action: string
  url: string
  data: any
}

interface NetworkSignal extends RawSignal {
  static: 'network'
  data: NetworkData
}

interface LocalData {
  action: string
  identifier: string
  data: string
}

interface LocalDataSignal extends RawSignal {
  type: 'localData'
  data: LocalData
}

interface InstrumentationData {
  type: 'instrumentation'
  rawEvent: any
}

interface UserDefinedSignal extends RawSignal {
  type: 'userDefined'
  data: any
}

interface InstrumentationSignal extends RawSignal {
  data: InstrumentationData
}
