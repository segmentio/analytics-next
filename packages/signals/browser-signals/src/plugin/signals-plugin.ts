import type { Plugin } from '@segment/analytics-next'
import { Signals } from '../core/signals'
import { logger } from '../lib/logger'
import { AnyAnalytics, Signal, SignalsPluginSettingsConfig } from '../types'
import { assertBrowserEnv } from '../lib/assert-browser-env'

export type OnSignalCb = (signal: Signal) => void

interface SignalsAugmentedFunctionality {
  stop(): void

  /**
   * Subscribe to signals
   */
  onSignal: (fn: OnSignalCb) => void

  /**
   * Emit/add a custom signal
   */
  addSignal(data: Signal): void
}

export class SignalsPlugin implements Plugin, SignalsAugmentedFunctionality {
  readonly type = 'utility'
  readonly name = 'SignalsPlugin'
  readonly version = '0.0.0'
  private signals: Signals

  constructor(settings: SignalsPluginSettingsConfig = {}) {
    assertBrowserEnv()
    if (settings.enableDebugLogging) {
      logger.enableDebugLogging()
    }
    logger.debug('SignalsPlugin initializing', { settings })
    // subscribe and store signals that may occur before analytics is fully initialized
    this.signals = new Signals({
      apiHost: settings.apiHost,
      maxBufferSize: settings.maxBufferSize,
      processSignal:
        typeof settings.processSignal === 'function'
          ? settings.processSignal.toString()
          : settings.processSignal,
    })
  }

  isLoaded() {
    return true
  }

  // this is the only required method in the analytics.js Plugin API
  public async load(_ctx: unknown, analytics: AnyAnalytics) {
    try {
      await this.signals.start(analytics)
      logger.debug('SignalsPlugin loaded')
    } catch (err) {
      console.error(err)
    }
  }

  stop() {
    return this.signals.stop()
  }

  onSignal(cb: (signal: Signal) => void) {
    this.signals.emitter.on('signal', cb)
  }

  addSignal(signal: Signal) {
    this.signals.emitter.emit('signal', signal)
  }
}
