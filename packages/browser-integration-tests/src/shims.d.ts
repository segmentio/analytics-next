import type { AnalyticsSnippet } from '@fernohq/analytics-next'

declare global {
  interface Window {
    analytics: AnalyticsSnippet
  }
}
