import { AnalyticsBrowser } from '@segment/analytics-next'
import { SignalsPlugin } from '@segment/analytics-signals'

/**
 * Not calling analytics.load() or instantiating Signals Plugin here, as all this configuration happens in the page object.
 */
window.SignalsPlugin = SignalsPlugin
window.analytics = new AnalyticsBrowser()
