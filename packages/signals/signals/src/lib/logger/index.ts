import type { Signal } from '../..'
import {
  LogLevelOptions,
  parseDebugModeQueryString,
  parseSignalsLogLevel,
} from '../../core/debug-mode'
import { WebStorage } from '../storage/web-storage'

class Logger {
  private logLevelKey = 'segment_signals_log_level'
  private storage = new WebStorage(window.sessionStorage)
  get logLevel(): LogLevelOptions {
    return this.storage.getItem(this.logLevelKey) ?? 'off'
  }

  constructor() {
    // if log level is set in query string, use that, otherwise if debug mode is set, set log level to info
    const logLevel = parseSignalsLogLevel()
    if (logLevel !== undefined) {
      logLevel === 'off' ? this.disableLogging() : this.enableLogging(logLevel)
    } else {
      const debugMode = parseDebugModeQueryString()
      if (debugMode === true) {
        this.enableLogging('info')
      }
    }
  }

  enableLogging = (type: LogLevelOptions) => {
    this.storage.setItem(this.logLevelKey, type)
  }

  disableLogging = () => {
    this.storage.setItem(this.logLevelKey, 'off')
  }

  private log = (level: 'info' | 'debug', ...args: any[]): void => {
    console.log(`[signals:${level}]`, ...args)
  }

  info = (...args: any[]): void => {
    if (this.logLevel === 'info' || this.logLevel === 'debug') {
      this.log('info', ...args)
    }
  }

  debug = (...args: any[]): void => {
    if (this.logLevel === 'debug') {
      this.log('debug', ...args)
    }
  }

  logSignal = (signal: Signal): void => {
    this.info(
      'New signal:',
      signal.type,
      signal.data,
      ...(signal.type === 'interaction' && 'change' in signal.data
        ? ['change:', JSON.stringify(signal.data.change, null, 2)]
        : [])
    )
  }
}

export const logger = new Logger()
