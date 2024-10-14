// all import directives will be removed in the final build
import { SignalsRuntime } from '../shared/signals-runtime'
import { ISignalsRuntime } from '../shared/shared-types'
import { Signal } from './web-signals-types'

export type Signals = ISignalsRuntime<Signal>
export const signals: Signals = new SignalsRuntime<Signal>()

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
