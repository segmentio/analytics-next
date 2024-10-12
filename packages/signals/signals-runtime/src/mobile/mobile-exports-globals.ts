// all import directives will be removed in the final build
import { Signal } from './mobile-signals-types'
import { ISignalsRuntime } from './mobile-exports'

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
declare const EventType: Readonly<{
  Track: 'track'
  Page: 'page'
  Screen: 'screen'
  Identify: 'identify'
  Group: 'group'
  Alias: 'alias'
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
