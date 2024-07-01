import type { AnalyticsBrowser } from '@segment/analytics-next'

declare global {
  interface Window {
    analytics: AnalyticsBrowser
  }
}
