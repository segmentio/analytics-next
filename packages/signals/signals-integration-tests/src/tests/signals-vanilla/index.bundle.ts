import { AnalyticsBrowser } from '@segment/analytics-next'
import { SignalsPlugin } from '@segment/analytics-signals'

/**
 * Not instantiating the analytics object here, as it will be instantiated in the test
 */
window.SignalsPlugin = SignalsPlugin
window.analytics = new AnalyticsBrowser()
