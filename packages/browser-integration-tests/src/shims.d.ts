import type { AnalyticsSnippet } from '@customerio/cdp-analytics-js'

declare global {
  interface Window {
    analytics: AnalyticsSnippet
  }
}
