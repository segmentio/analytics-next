// hacky debug.ts, can be replaced with a proper logging solution
// @ts-ignore

class Logger {
  private get debugLoggingEnabled() {
    return (window as any)['SEGMENT_CONSENT_WRAPPER_DEBUG_MODE'] === true
  }

  enableDebugLogging() {
    ;(window as any)['SEGMENT_CONSENT_WRAPPER_DEBUG_MODE'] = true
  }

  debug(...args: any[]): void {
    if (this.debugLoggingEnabled) {
      console.log('[consent wrapper debug]', ...args)
    }
  }
}

export const logger = new Logger()
