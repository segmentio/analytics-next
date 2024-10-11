import type { Plugin } from '@segment/analytics-next'
import { Signals } from '../core/signals'
import { logger } from '../lib/logger'
import { AnyAnalytics, Signal, SignalsPluginSettingsConfig } from '../types'
import { assertBrowserEnv } from '../lib/assert-browser-env'
import { version } from '../generated/version'

export type OnSignalCb = (signal: Signal) => void

interface SignalsAugmentedFunctionality {
  stop(): void
  /**
   * Listen to signals
   */
  onSignal: (fn: OnSignalCb) => this

  /**
   * Emit/add a custom signal
   */
  addSignal(data: Signal): this
}

export class SignalsPlugin implements Plugin, SignalsAugmentedFunctionality {
  readonly type = 'utility'
  readonly name = 'SignalsPlugin'
  readonly version = version
  public signals: Signals

  constructor(settings: SignalsPluginSettingsConfig = {}) {
    assertBrowserEnv()
    if (settings.enableDebugLogging) {
      logger.enableDebugLogging()
    }
    logger.debug('SignalsPlugin initializing', { settings })

    this.signals = new Signals({
      enableSignalsDebug: settings.enableSignalsDebug,
      flushAt: settings.flushAt,
      flushInterval: settings.flushInterval,
      functionHost: settings.functionHost,
      apiHost: settings.apiHost,
      maxBufferSize: settings.maxBufferSize,
      processSignal:
        typeof settings.processSignal === 'function'
          ? settings.processSignal.toString()
          : settings.processSignal,
      networkSignalsAllowSameDomain: settings.networkSignalsAllowSameDomain,
      networkSignalsAllowList: settings.networkSignalsAllowList,
      networkSignalsDisallowList: settings.networkSignalsDisallowList,
      signalStorage: settings.signalStorage,
    })
  }

  isLoaded() {
    return true
  }

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
    this.signals.signalEmitter.subscribe(cb)
    return this
  }

  addSignal(signal: Signal) {
    this.signals.signalEmitter.emit(signal)
    return this
  }
}
