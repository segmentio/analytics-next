import type { AnalyticsBrowser, SegmentEvent } from '@segment/analytics-next'
import type { Signal, SignalsPlugin } from '@segment/analytics-signals'

declare global {
  interface Window {
    analytics: AnalyticsBrowser
    signalsPlugin: SignalsPlugin
    signalsEmitted: Signal[]
    segmentEvents: SegmentEvent[]
  }
}
