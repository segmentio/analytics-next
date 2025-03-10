
import { AnalyticsBrowser } from '@customerio/cdp-analytics-browser'

const analytics = AnalyticsBrowser.load({ writeKey: '<YOUR_WRITE_KEY>' })

analytics.identify('hello world')

