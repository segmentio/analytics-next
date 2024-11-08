import {
  parseDebugModeQueryString,
  parseSignalsLogLevel,
} from '../../core/debug-mode'
import { DebugStorage } from '../storage/debug-storage'

class Logger {
  private static infoLogging = 'segment_signals_log_level_info'
  private static debugLogging = 'segment_signals_log_level_debug'

  storage = new DebugStorage('sessionStorage')

  constructor() {
    // if debug mode is in the query string, we want simple logging
    const debugMode = parseDebugModeQueryString()
    if (typeof debugMode === 'boolean') {
      this.enableLogging('info')
    }

    // if log level is set to 'off' / 'log' / 'debug' in the query string, we want to set the write key
    const logLevel = parseSignalsLogLevel()
    if (logLevel !== undefined) {
      logLevel === 'off' ? this.disableLogging() : this.enableLogging(logLevel)
    }
  }

  private loggingEnabled = (): boolean => {
    return this.storage.getDebugKey(Logger.infoLogging)
  }

  private debugLoggingEnabled = (): boolean => {
    return this.storage.getDebugKey(Logger.debugLogging)
  }

  enableDebugLogging = (bool = true) => {
    this.storage.setDebugKey(Logger.debugLogging, bool)
  }

  // if debug level is enabled, info level is also enabled
  enableLogging = (type: 'info' | 'debug') => {
    if (type === 'info') {
      this.storage.setDebugKey(Logger.infoLogging, true)
      this.storage.setDebugKey(Logger.debugLogging, false)
    } else if (type === 'debug') {
      this.storage.setDebugKey(Logger.debugLogging, true)
      this.storage.setDebugKey(Logger.infoLogging, true)
    }
  }

  disableLogging = () => {
    this.storage.setDebugKey(Logger.infoLogging, false)
    this.storage.setDebugKey(Logger.debugLogging, false)
  }

  info = (...args: any[]): void => {
    if (this.loggingEnabled() || this.debugLoggingEnabled()) {
      console.log('[signals log]', ...args)
    }
  }

  debug = (...args: any[]): void => {
    if (this.debugLoggingEnabled()) {
      console.log('[signals debug]', ...args)
    }
  }
}

export const logger = new Logger()
