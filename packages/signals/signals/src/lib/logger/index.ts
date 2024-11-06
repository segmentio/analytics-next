import { parseDebugLoggingQueryString } from '../../core/debug-mode'

class Logger {
  private storageType = 'sessionStorage' as const
  private static loggingKey = 'segment_signals_debug_logging'
  public signalsOnly = false
  constructor() {
    const val = parseDebugLoggingQueryString()
    if (typeof val === 'boolean') {
      this.setDebugKey(Logger.loggingKey, val)
    }
  }

  private debugLoggingEnabled = (): boolean => {
    try {
      const isEnabled = Boolean(
        globalThis[this.storageType].getItem(Logger.loggingKey)
      )
      if (isEnabled) {
        return true
      }
    } catch (e) {
      console.warn('Storage error', e)
    }
    return false
  }

  private setDebugKey = (key: string, enable: boolean) => {
    try {
      if (enable) {
        globalThis[this.storageType].setItem(key, 'true')
      } else {
        globalThis[this.storageType].removeItem(key)
      }
    } catch (e) {
      console.warn('Storage error', e)
    }
  }

  enableDebugLogging = (bool = true) => {
    this.setDebugKey(Logger.loggingKey, bool)
  }

  log = (...args: any[]): void => {
    console.log('[signals]', ...args)
  }

  debug = (...args: any[]): void => {
    if (this.debugLoggingEnabled()) {
      console.log('[signals debug]', ...args)
    }
  }
}

export const logger = new Logger()
