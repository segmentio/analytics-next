This package is for the OneTrust integration for analytics consent


# Quick Start
### Snippet users:
1.) Remove `.load` from your snippet
```ts
import { oneTrust } from '@segment/analytics-consent-wrapper-onetrust'


// snippet users
oneTrust(window.analytics)

```
### NPM Users
```ts
import { oneTrust } from '@segment/analytics-consent-wrapper-onetrust'
import { AnalyticsBrowser } from '@segment/analytics-next'

export const analytics = new AnalyticsBrowser()

oneTrust(analytics)

analytics.load({ writeKey: '<MY_WRITE_KEY'> })

```
