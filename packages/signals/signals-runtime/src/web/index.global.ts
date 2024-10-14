import { SignalsRuntime } from '../shared/signals-runtime'
import { EventType, NavigationAction, SignalType } from '../web/web-constants'

// the purpose of this is to create an artifact that can be uploaded to a CDN used in the mobile runtime
// the web version can use this package directly.
Object.assign(globalThis, {
  SignalsRuntime,
  EventType,
  NavigationAction,
  SignalType,
})
