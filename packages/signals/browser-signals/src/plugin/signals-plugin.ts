import type { Plugin } from '@segment/analytics-next'
import { Signals } from '../core/signals'
import { logger } from '../lib/logger'
import { AnyAnalytics, ProcessSignal } from '../types'

export interface SignalsPluginSettings {
  enableDebugLogging?: boolean
  /**
   * Max number of signals in the default signal store
   */
  maxBufferSize?: number

  processSignal?: string | ProcessSignal
}

export class SignalsPlugin implements Plugin {
  readonly type = 'utility'
  readonly name = 'SignalsPlugin'
  readonly version = '0.0.0'
  private signals: Signals
  constructor(settings: SignalsPluginSettings = {}) {
    if (settings.enableDebugLogging) {
      logger.enableDebugLogging()
    }
    logger.debug('SignalsPlugin initializing', { settings })
    // subscribe and store signals that may occur before analytics is fully initialized
    this.signals = new Signals({
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
}
