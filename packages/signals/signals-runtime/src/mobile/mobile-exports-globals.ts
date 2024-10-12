// all import directives will be removed in the final build
import { MobileSignalsRuntime } from './mobile-signals-types'

// This will be appended to the generated code - dts-bundle-generator will not write declare const for whatever reason.
declare const signals: MobileSignalsRuntime
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
  Forward: 'forward'
  Backward: 'backward'
  Modal: 'modal'
  Entering: 'entering'
  Leaving: 'leaving'
  Page: 'page'
  Popup: 'popup'
}

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
