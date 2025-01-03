import type { SignalEmitter } from '../emitter'
import { SignalGlobalSettings } from '../signals'

export interface SignalGenerator {
  /**
   * To support unregistering by name/label
   * e.g "form-submit"
   */
  id?: string
  /**
   * Register a custom function that emits signals.
   * If this function returns a promise, signals client will not be able to send signals until the promise resolves.
   */
  register(emitter: SignalEmitter): (() => void) | Promise<() => void>
}

export interface SignalGeneratorClass {
  id?: string
  new (settings: SignalGlobalSettings): SignalGenerator
}
