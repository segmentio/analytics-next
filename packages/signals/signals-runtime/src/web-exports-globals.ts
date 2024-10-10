// all import directives will be removed in the final build
import { ISignalsRuntime, Signal } from './web-exports'

// This will be appended to the generated code - dts-bundle-generator will not write declare const for whatever reason.
declare const signals: ISignalsRuntime<Signal>
declare const SignalType: {
  Interaction: 'interaction'
  Navigation: 'navigation'
  Network: 'network'
  LocalData: 'localData'
  Instrumentation: 'instrumentation'
  UserDefined: 'userDefined'
}
declare const EventType: {
  Track: 'track'
  Page: 'page'
  Screen: 'screen'
  Identify: 'identify'
  Group: 'group'
  Alias: 'alias'
}
declare const NavigationAction: {
  URLChange: 'urlChange'
  PageLoad: 'pageLoad'
}
