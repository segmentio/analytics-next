import type { Plugin } from '@segment/analytics-next'
import { Signals } from '../core/signals'
import { logger } from '../lib/logger'
import { AnyAnalytics, SignalsPluginSettingsConfig } from '../types'
import { Signal } from '@segment/analytics-signals-runtime'
import { assertBrowserEnv } from '../lib/assert-browser-env'
import { version } from '../generated/version'
import { SignalsMiddleware } from '../core/emitter'

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
    // assign to window for debugging purposes
    Object.assign(window, { SegmentSignalsPlugin: this })

    if (settings.enableDebugLogging) {
      logger.enableLogging('debug')
    }

    logger.debug(`SignalsPlugin v${version} initializing`, {
      settings,
    })

    this.signals = new Signals({
      disableSignalsRedaction: settings.disableSignalsRedaction,
      enableSignalsIngestion: settings.enableSignalsIngestion,
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
      signalStorageType: settings.signalStorageType,
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

  addSignal(signal: Signal): this {
    this.signals.signalEmitter.emit(signal)
    return this
  }

  /**
   * Register custom signals middleware, to drop signals or modify them before they are emitted.
   * @param example
   *```ts
   * class MyMiddleware implements SignalsMiddleware {
   *   private unstableGlobalSettings!: SignalsMiddlewareContext['settings'];
   *
   *   load({ unstableGlobalSettings, analytics }: SignalsMiddlewareContext) {
   *     this.settings = unstableGlobalSettings;
   *   }
   *
   *   process(signal: Signal) {
   *     // drop signal if it does not match the filter list
   *     if (
   *        signal.type === 'network' &&
   *        signal.data.action === 'request' &&
   *        signal.data.contentType.includes('api-keys')
   *     ) {
   *       return null;
   *     } else {
   *       return signal;
   *     }
   *   }
   * }
   *
   * signalsPlugin.register(new MyMiddleware());
   * ````
   *
   */
  register(...middleware: SignalsMiddleware[]): void {
    this.signals.signalEmitter.register(...middleware)
  }

  /**
   * Enable redaction and disable ingestion of signals. Also, logs signals to the console.
   */
  debug(...args: Parameters<typeof this.signals['debug']>): void {
    this.signals.debug(...args)
  }
}
