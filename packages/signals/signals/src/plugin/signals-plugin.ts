import type { Plugin } from '@segment/analytics-next'
import { Signals } from '../core/signals'
import { logger } from '../lib/logger'
import { AnyAnalytics, SignalsPluginSettingsConfig } from '../types'
import { Signal } from '@segment/analytics-signals-runtime'
import { assertBrowserEnv } from '../lib/assert-browser-env'
import { version } from '../generated/version'
import { createUserDefinedSignal } from '../types/factories'

export type OnSignalCb = (signal: Signal) => void

interface SignalsAugmentedFunctionality {
  stop(): void
  /**
   * Listen to signals
   */
  onSignal: (fn: OnSignalCb) => this

  /**
   * Emit/add a custom signal of type 'userDefined'
   */
  addSignal(userDefinedData: Record<string, unknown>): this
}

export class SignalsPlugin implements Plugin, SignalsAugmentedFunctionality {
  readonly type = 'utility'
  readonly name = 'SignalsPlugin'
  readonly version = version
  public signals: Signals
  constructor(settings: SignalsPluginSettingsConfig = {}) {
    assertBrowserEnv()

    // assign to window.SegmentSignalsPlugin for debugging purposes (e.g window.SegmentSignalsPlugin.debug())
    Object.assign(window, { SegmentSignalsPlugin: this })

    this.signals = new Signals({
      ...settings,
      processSignal:
        typeof settings.processSignal === 'function'
          ? settings.processSignal.toString()
          : settings.processSignal,
    })

    logger.debug(`SignalsPlugin v${version} initializing`, {
      settings,
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

  onSignal(cb: (signal: Signal) => void): this {
    this.signals.signalEmitter.subscribe(cb)
    return this
  }

  addSignal(data: Record<string, unknown>): this {
    this.signals.signalEmitter.emit(createUserDefinedSignal(data))
    return this
  }

  /**
   * Enable redaction and disable ingestion of signals. Also, logs signals to the console.
   */
  debug(...args: Parameters<typeof this.signals['debug']>): this {
    this.signals.debug(...args)
    return this
  }
}
