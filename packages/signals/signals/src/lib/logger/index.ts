import { parseDebugLoggingQueryString } from '../../core/debug-mode'

class Logger {
  private static loggingKey = 'segment_signals_debug_logging_enabled'
  constructor() {
    const val = parseDebugLoggingQueryString()
    if (typeof val === 'boolean') {
      this.setDebugKey(Logger.loggingKey, val)
    }
  }

  private debugLoggingEnabled(): boolean {
    try {
      const isEnabled = Boolean(
        window.sessionStorage.getItem(Logger.loggingKey)
      )
      if (isEnabled) {
        return true
      }
    } catch (e) {
      logger.debug('Storage error', e)
    }
    return false
  }

  private setDebugKey(key: string, enable: boolean) {
    try {
      if (enable) {
        window.sessionStorage.setItem(key, 'true')
      } else {
        logger.debug(`Removing debug key ${key} from storage`)
        window.sessionStorage.removeItem(key)
      }
    } catch (e) {
      logger.debug('Storage error', e)
    }
  }

  enableDebugLogging(bool = true) {
    this.setDebugKey(Logger.loggingKey, bool)
  }

  debug(...args: any[]): void {
    if (this.debugLoggingEnabled()) {
      console.log('[signals debug]', ...args)
    }
  }
}

export const logger = new Logger()
