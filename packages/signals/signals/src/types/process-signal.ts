import { SignalsRuntime } from '../core/processor/signals-runtime'
import { Signal } from './signals'

/**
 * Types for the signals runtime
 */
export interface AnalyticsRuntimePublicApi {
  track: (...args: any[]) => void
  identify: (...args: any[]) => void
  alias: (...args: any[]) => void
  group: (...args: any[]) => void
  page: (...args: any[]) => void
  screen: (...args: any[]) => void
}

export type ProcessSignalScope = {
  analytics: AnalyticsRuntimePublicApi
  signals: SignalsRuntime
} & typeof AnalyticsEnums

export interface ProcessSignal {
  (signal: Signal, ctx: ProcessSignalScope): void
}

export const AnalyticsEnums = {
  SignalType: Object.freeze({
    Interaction: 'interaction',
    Navigation: 'navigation',
    Network: 'network',
    LocalData: 'localData',
    Instrumentation: 'instrumentation',
    UserDefined: 'userDefined',
  }),
  EventType: Object.freeze({
    Track: 'track',
    Page: 'page',
    Screen: 'screen',
    Identify: 'identify',
    Group: 'group',
    Alias: 'alias',
  }),
  NavigationAction: Object.freeze({
    URLChange: 'urlChange',
    PageLoad: 'pageLoad',
  }),
}
