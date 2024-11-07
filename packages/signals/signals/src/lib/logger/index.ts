import { parseSignalsLoggingAdvancedQueryString } from '../../core/debug-mode'
import { DebugStorage } from '../storage/debug-storage'

class Logger {
  private storageType = 'sessionStorage' as const
  private static advancedLogging = 'segment_signals_logging_advanced'

  storage = new DebugStorage(this.storageType)
  constructor() {
    const val = parseSignalsLoggingAdvancedQueryString()
    if (typeof val === 'boolean') {
      this.storage.setDebugKey(Logger.advancedLogging, val)
    }
  }

  private debugLoggingEnabled = (): boolean => {
    return this.storage.getDebugKey(Logger.advancedLogging)
  }

  enableDebugLogging = (bool = true) => {
    this.storage.setDebugKey(Logger.advancedLogging, bool)
  }

  log = (...args: any[]): void => {
    console.log('[signals log]', ...args)
  }

  debug = (...args: any[]): void => {
    if (this.debugLoggingEnabled()) {
      console.log('[signals debug]', ...args)
    }
  }
}

export const logger = new Logger()
