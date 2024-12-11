import type { AnalyticsBrowser } from '@segment/analytics-next'
import type { SignalsPlugin } from '@segment/analytics-signals'

declare global {
  interface Window {
    analytics: AnalyticsBrowser
    signalsPlugin: SignalsPlugin
    SignalsPlugin: typeof SignalsPlugin
  }
}
