import { AnalyticsBrowser } from '@segment/analytics-next'
import { SignalsPlugin } from '@segment/analytics-signals'

declare global {
  interface Window {
    analytics: AnalyticsBrowser
    SignalsPlugin: typeof SignalsPlugin
    signalsPlugin: SignalsPlugin
  }
}

/**
 * Not instantiating the analytics object here, as it will be instantiated in the test
 */
;(window as any).SignalsPlugin = SignalsPlugin
;(window as any).analytics = new AnalyticsBrowser()
