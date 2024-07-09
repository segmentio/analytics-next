class Logger {
  globalKey = 'SEGMENT_SIGNALS_DEBUG'
  get debugLoggingEnabled() {
    return (window as any)[this.globalKey] === true
  }

  enableDebugLogging() {
    ;(window as any)[this.globalKey] = true
  }

  debug(...args: any[]): void {
    if (this.debugLoggingEnabled) {
      console.log('[signals debug]', ...args)
    }
  }
}

export const logger = new Logger()
