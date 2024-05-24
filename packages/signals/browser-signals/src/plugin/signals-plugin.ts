import type { Plugin } from '@segment/analytics-next'
import { Signals } from '../core/signals'
import { logger } from '../lib/logger'
import { AnyAnalytics } from '../types'

interface SignalsPluginSettings {
  enableDebugLogging?: boolean
  /**
   * Max number of signals in the default signal store
   */
  maxBufferSize?: number
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
    // subscribe and store signals that may occur before analyics is fully initialized
    this.signals = new Signals({
      maxBufferSize: settings.maxBufferSize,
    })
  }

  isLoaded() {
    return true
  }

  // this is the only required method in the analytics.js Plugin API
  public async load(_ctx: unknown, analytics: AnyAnalytics) {
    return this.signals.start(analytics)
  }

  stop() {
    return this.signals.stop()
  }
}
