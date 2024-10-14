// all import directives will be removed in the final build
import { SignalsRuntime } from '../shared/signals-runtime'

// This will be appended to the generated code - dts-bundle-generator will not write declare const for whatever reason.
export const signals = new SignalsRuntime()

export const EventType = Object.freeze({
  Track: 'track',
  Page: 'page',
  Screen: 'screen',
  Identify: 'identify',
  Group: 'group',
  Alias: 'alias',
})

export const NavigationAction = Object.freeze({
  URLChange: 'urlChange',
  PageLoad: 'pageLoad',
})

export const SignalType = Object.freeze({
  Interaction: 'interaction',
  Navigation: 'navigation',
  Network: 'network',
  LocalData: 'localData',
  Instrumentation: 'instrumentation',
  UserDefined: 'userDefined',
})
