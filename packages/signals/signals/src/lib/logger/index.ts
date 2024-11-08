import {
  LogLevelOptions,
  parseDebugModeQueryString,
  parseSignalsLogLevel,
} from '../../core/debug-mode'
import { WebStorage } from '../storage/web-storage'

class Logger {
  private logLevelKey = 'segment_signals_log_level'
  get logLevel(): LogLevelOptions {
    return this.storage.getItem(this.logLevelKey) ?? 'off'
  }
  storage = new WebStorage(window.sessionStorage)

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

  // if debug level is enabled, info level is also enabled
  enableLogging = (type: LogLevelOptions) => {
    this.storage.setItem(this.logLevelKey, type)
  }

  disableLogging = () => {
    this.storage.setItem(this.logLevelKey, 'off')
  }

  info = (...args: any[]): void => {
    if (this.logLevel === 'info' || this.logLevel === 'debug') {
      console.log('[signals log]', ...args)
    }
  }

  debug = (...args: any[]): void => {
    if (this.logLevel === 'debug') {
      console.log('[signals debug]', ...args)
    }
  }
}

export const logger = new Logger()
