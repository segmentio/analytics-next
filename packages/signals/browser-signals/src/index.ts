/**
 * This is the public API for this package.
 * We avoid using splat (*) exports so that we can control what is exposed.
 */
export { SignalsPlugin } from './plugin/signals-plugin'
export { Signals } from './core/signals'

export type {
  ProcessSignal,
  AnalyticsRuntimePublicApi,
  SignalsPluginSettingsConfig,
} from './types'
