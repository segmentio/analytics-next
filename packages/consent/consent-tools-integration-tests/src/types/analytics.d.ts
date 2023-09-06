import type { AnalyticsSnippet } from '@segment/analytics-next'

declare global {
  interface Window {
    analytics: AnalyticsSnippet
  }
}
