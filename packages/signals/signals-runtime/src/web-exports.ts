/**
 * This is the public API for this package.
 * We avoid using splat (*) exports so that we can control what is exposed.
 */
export * from './types/web/signals'
import { SignalsRuntimeAPI } from './types/web/signals'
declare global {
  interface Window {
    signals: SignalsRuntimeAPI
  }
}
