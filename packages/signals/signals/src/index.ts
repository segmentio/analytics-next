/**
 * This is the public API for this package.
 * We avoid using splat (*) exports so that we can control what is exposed.
 */
export { SignalsPlugin } from './plugin/signals-plugin'
export { Signals } from './core/signals'
export type { Signal } from '@segment/analytics-signals-runtime'
export type {
  SignalsMiddleware,
  SignalsMiddlewareContext,
} from './core/emitter'
export type {
  ProcessSignal,
  AnalyticsRuntimePublicApi,
  SignalsPluginSettingsConfig,
} from './types'
