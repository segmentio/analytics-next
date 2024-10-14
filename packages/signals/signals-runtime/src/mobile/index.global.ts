import { SignalsRuntime } from '../shared/signals-runtime'
import { EventType, NavigationAction, SignalType } from '../web/web-constants'

// the purpose of this is to create an artifact that can be uploaded to a CDN and used in the various SDKs
Object.assign(globalThis, {
  SignalsRuntime,
  EventType,
  NavigationAction,
  SignalType,
})
