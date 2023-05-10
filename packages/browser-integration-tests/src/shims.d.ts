import type { AnalyticsSnippet } from '@customerio/cdp-analytics-browser'

declare global {
  interface Window {
    analytics: AnalyticsSnippet
  }
}
